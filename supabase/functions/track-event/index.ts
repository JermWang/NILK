// Import dependencies
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

const COW_STATS = {
  cosmic: { fusionFee: 75000 },
  galactic_moo_moo: { fusionFee: 350000 },
};

// Define costs and effects for in-game actions
const FUSION_COST_NILK = 1000;
const FLASK_COSTS = {
  'YIELD_BOOST': { raw_nilk: 500, nilk: 250 },
  'FUSION_FLUX': { raw_nilk: 500, nilk: 250 },
  'CHRONO_CONDENSATE': { raw_nilk: 1000, nilk: 500 },
};
const FLASK_EFFECTS = {
  'YIELD_BOOST': { bonus: 0.1 },         // 10% bonus NILK processing
  'FUSION_FLUX': { discount: 0.2 },      // 20% discount on fusion cost
  'CHRONO_CONDENSATE': { bonus: 0.5 },   // 50% boost to passive generation
};
const FLASK_DURATION_MS = 60 * 60 * 1000; // 1 hour

// More specific data interfaces for each event type
interface ProcessNilkData {
  amount: number;
  description?: string;
}

interface PerformFusionData {
  cow1Id: string;
  cow2Id: string;
  outputTier: 'cosmic' | 'galactic_moo_moo';
  description?: string;
}

interface CraftFlaskData {
  flaskType: 'YIELD_BOOST' | 'FUSION_FLUX' | 'CHRONO_CONDENSATE';
  description?: string;
}

interface ActivateFlaskData {
  flaskType: 'YIELD_BOOST' | 'FUSION_FLUX' | 'CHRONO_CONDENSATE';
}

interface EarnHypeData {
  amount: number;
  description?: string;
}

// Main event payload shape
interface EventPayload {
  eventType: 'PROCESS_NILK' | 'PERFORM_FUSION' | 'CRAFT_FLASK' | 'ACTIVATE_FLASK' | 'EARN_HYPE';
  userId: string;
  data: ProcessNilkData | PerformFusionData | CraftFlaskData | ActivateFlaskData | EarnHypeData;
}

serve(async (req: Request) => {
  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { eventType, userId, data }: EventPayload = await req.json();

    // Create a Supabase client with the service role key for elevated privileges
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch user profile for validation
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('raw_nilk, nilk_balance, cow_inventory, flask_inventory, active_flask, active_flask_expires_at, base_raw_nilk_generation_rate, raw_nilk_generation_rate')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }

    // --- Expired Flask Cleanup ---
    let profileUpdateForExpiry: Record<string, any> = {};
    const now = new Date();
    if (userProfile.active_flask && userProfile.active_flask_expires_at) {
      const expiryDate = new Date(userProfile.active_flask_expires_at);
      if (now > expiryDate) {
        // If the chrono condensate was active, revert the generation rate
        if (userProfile.active_flask === 'CHRONO_CONDENSATE') {
            profileUpdateForExpiry.raw_nilk_generation_rate = userProfile.base_raw_nilk_generation_rate;
        }
        profileUpdateForExpiry = {
            ...profileUpdateForExpiry,
            active_flask: null,
            active_flask_expires_at: null,
        };
        
        userProfile.active_flask = null;
        userProfile.active_flask_expires_at = null;
        userProfile.raw_nilk_generation_rate = userProfile.base_raw_nilk_generation_rate;
      }
    }

    if(Object.keys(profileUpdateForExpiry).length > 0) {
        const { error: expiryUpdateError } = await supabase
            .from('profiles')
            .update(profileUpdateForExpiry)
            .eq('id', userId);
        if (expiryUpdateError) console.error("Error updating expired flask:", expiryUpdateError);
    }

    let responseData = {};

    switch (eventType) {
      case 'PROCESS_NILK': {
        const { amount, description } = data as ProcessNilkData;
        let finalAmount = amount;

        // VALIDATION
        if (!amount || amount <= 0) throw new Error("Invalid amount specified for processing NILK.");
        if (userProfile.raw_nilk < amount) throw new Error("Insufficient raw nilk.");

        // APPLY FLASK EFFECT
        if (userProfile.active_flask === 'YIELD_BOOST') {
            finalAmount = Math.floor(amount * (1 + FLASK_EFFECTS.YIELD_BOOST.bonus));
        }

        // DEDUCT resources
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ raw_nilk: userProfile.raw_nilk - amount }) // Deduct original amount
          .eq('id', userId);
        if (updateError) throw updateError;
        
        // ACTION: Increment raw_nilk_processed with final amount
        const { error: rpcError } = await supabase.rpc('increment_raw_nilk_processed', {
          p_user_id: userId,
          p_amount: finalAmount,
        });
        if (rpcError) throw rpcError;

        // LOGGING
        const { error: eventError } = await supabase.from('economic_events').insert({
          event_type: 'MINT_NILK',
          user_id: userId,
          amount: finalAmount,
          currency: 'NILK',
          description: description || `User processed ${amount} Raw Nilk into ${finalAmount} $NILK` + (finalAmount > amount ? ' (Yield Boost Active)' : ''),
        });
        if (eventError) throw eventError;

        responseData = { message: `Successfully processed ${finalAmount} NILK.` };
        break;
      }

      case 'PERFORM_FUSION': {
        const { description, outputTier } = data as PerformFusionData;

        const fusionFee = COW_STATS[outputTier]?.fusionFee;
        if (!fusionFee) {
          throw new Error(`Invalid outputTier specified for fusion: ${outputTier}`);
        }

        let finalCost = fusionFee;

        // APPLY FLASK EFFECT
        if (userProfile.active_flask === 'FUSION_FLUX') {
            finalCost = Math.floor(finalCost * (1 - FLASK_EFFECTS.FUSION_FLUX.discount));
        }

        // VALIDATION: Check if user has enough NILK for fusion
        if (userProfile.nilk_balance < finalCost) {
          throw new Error(`Insufficient $NILK for fusion. Required: ${finalCost}, Have: ${userProfile.nilk_balance}`);
        }

        // DEDUCT resources
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ nilk_balance: userProfile.nilk_balance - finalCost })
          .eq('id', userId);
        if (updateError) throw updateError;
        
        // ACTION: Increment fusion_count
        const { error: rpcError } = await supabase.rpc('increment_fusion_count', {
          p_user_id: userId,
        });
        if (rpcError) throw rpcError;

        // LOGGING
        const { error: eventError } = await supabase.from('economic_events').insert({
          event_type: 'BURN_NILK_FUSION',
          user_id: userId,
          amount: finalCost,
          currency: 'NILK',
          description: description || `User performed a fusion into ${outputTier}, burning ${finalCost} $NILK` + (finalCost < fusionFee ? ' (Fusion Flux Active)' : ''),
        });
        if (eventError) throw eventError;
        
        responseData = { message: "Successfully tracked fusion and logged event." };
        break;
      }
      
      case 'CRAFT_FLASK': {
        const { flaskType, description } = data as CraftFlaskData;
        const costs = FLASK_COSTS[flaskType];

        if (!costs) {
          throw new Error("Invalid flask type.");
        }

        // VALIDATION: Check for sufficient resources
        if (userProfile.raw_nilk < costs.raw_nilk || userProfile.nilk_balance < costs.nilk) {
          throw new Error(`Insufficient resources to craft ${flaskType}.`);
        }

        // DEDUCT resources
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            raw_nilk: userProfile.raw_nilk - costs.raw_nilk,
            nilk_balance: userProfile.nilk_balance - costs.nilk,
            // Assuming flask_inventory is a JSONB array of strings
            flask_inventory: [...(userProfile.flask_inventory || []), flaskType],
          })
          .eq('id', userId);
        if (updateError) throw updateError;

        // LOGGING
        const { error: eventError } = await supabase.from('economic_events').insert({
          event_type: 'CRAFT_ITEM',
          user_id: userId,
          amount: costs.nilk,
          currency: 'NILK',
          description: description || `User crafted ${flaskType}`,
        });
        if (eventError) throw eventError;

        responseData = { message: `Successfully crafted ${flaskType}.` };
        break;
      }
      
      case 'ACTIVATE_FLASK': {
        const { flaskType } = data as ActivateFlaskData;
        
        // VALIDATION: Check if user has the flask
        const flaskIndex = (userProfile.flask_inventory || []).indexOf(flaskType);
        if (flaskIndex === -1) {
            throw new Error(`User does not have a ${flaskType} flask.`);
        }
        if (userProfile.active_flask) {
            throw new Error(`Another flask is already active.`);
        }

        const newInventory = [...userProfile.flask_inventory];
        newInventory.splice(flaskIndex, 1);

        const profileUpdate: Record<string, any> = {
            flask_inventory: newInventory,
            active_flask: flaskType,
            active_flask_expires_at: new Date(Date.now() + FLASK_DURATION_MS).toISOString(),
        };

        if (flaskType === 'CHRONO_CONDENSATE') {
            profileUpdate.raw_nilk_generation_rate = userProfile.base_raw_nilk_generation_rate * (1 + FLASK_EFFECTS.CHRONO_CONDENSATE.bonus);
        }

        // ACTION: Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', userId);
        if (updateError) throw updateError;

        responseData = { message: `${flaskType} has been activated.` };
        break;
      }
        
      case 'EARN_HYPE': {
        const { amount, description } = data as EarnHypeData;
        
        if (!amount || amount <= 0) {
          throw new Error("Invalid amount specified for earning HYPE.");
        }

        // ACTION: Increment hype_earned and hype_balance
        const { error: rpcError } = await supabase.rpc('increment_hype', {
            p_user_id: userId,
            p_amount: amount,
        });
        if (rpcError) throw rpcError;

        // LOGGING
        const { error: eventError } = await supabase.from('economic_events').insert({
            event_type: 'EARN_HYPE',
            user_id: userId,
            amount: amount,
            currency: 'HYPE',
            description: description || 'User earned HYPE from an achievement or reward',
        });
        if (eventError) throw eventError;

        responseData = { message: "Successfully tracked HYPE earnings." };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid event type" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 