// Import dependencies
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { z } from "zod";
import { corsHeaders } from "../_shared/cors.ts";

// --- Zod Schemas for Input Validation ---
const ProcessNilkDataSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

const PerformFusionDataSchema = z.object({
  outputTier: z.enum(['cosmic', 'galactic_moo_moo']),
  description: z.string().optional(),
});

const CraftFlaskDataSchema = z.object({
  flaskType: z.enum(['YIELD_BOOST', 'FUSION_FLUX', 'CHRONO_CONDENSATE']),
  description: z.string().optional(),
});

const ActivateFlaskDataSchema = z.object({
  flaskType: z.enum(['YIELD_BOOST', 'FUSION_FLUX', 'CHRONO_CONDENSATE']),
});

const EarnHypeDataSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
});

const EventPayloadSchema = z.discriminatedUnion("eventType", [
  z.object({ eventType: z.literal('PROCESS_NILK'), data: ProcessNilkDataSchema }),
  z.object({ eventType: z.literal('PERFORM_FUSION'), data: PerformFusionDataSchema }),
  z.object({ eventType: z.literal('CRAFT_FLASK'), data: CraftFlaskDataSchema }),
  z.object({ eventType: z.literal('ACTIVATE_FLASK'), data: ActivateFlaskDataSchema }),
  z.object({ eventType: z.literal('EARN_HYPE'), data: EarnHypeDataSchema }),
]);
// --- End Zod Schemas ---

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
    // --- Step 1: Securely Authenticate User ---
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id; // Use the authenticated user's ID

    // --- Step 2: Validate Input Payload ---
    const rawPayload = await req.json();
    const parsedPayload = EventPayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', issues: parsedPayload.error.issues }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { eventType, data } = parsedPayload.data;

    // --- Step 3: Fetch User Profile for Validation ---
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('nilk_balance, raw_nilk_balance, cow_inventory, flask_inventory, active_flask, active_flask_expires_at, base_raw_nilk_generation_rate, raw_nilk_generation_rate')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      throw new Error(`User profile not found for authenticated user`);
    }

    // --- Step 4: Expired Flask Cleanup ---
    // This is run before the main event to ensure state is current
    const now = new Date();
    if (userProfile.active_flask && userProfile.active_flask_expires_at) {
      const expiryDate = new Date(userProfile.active_flask_expires_at);
      if (now > expiryDate) {
        let profileUpdateForExpiry: Record<string, any> = {
            active_flask: null,
            active_flask_expires_at: null,
        };
        // If the chrono condensate was active, revert the generation rate
        if (userProfile.active_flask === 'CHRONO_CONDENSATE') {
            profileUpdateForExpiry.raw_nilk_generation_rate = userProfile.base_raw_nilk_generation_rate;
        }
        
        const { error: expiryUpdateError } = await supabase
            .from('profiles')
            .update(profileUpdateForExpiry)
            .eq('id', userId);
        
        if (expiryUpdateError) console.error("Error updating expired flask:", expiryUpdateError);
        else {
            // Update local profile object to reflect change for current transaction
            userProfile.active_flask = null;
            userProfile.active_flask_expires_at = null;
            if (profileUpdateForExpiry.raw_nilk_generation_rate) {
                userProfile.raw_nilk_generation_rate = profileUpdateForExpiry.raw_nilk_generation_rate;
            }
        }
      }
    }

    let responseData = {};

    // --- Step 5: Process Events ---
    switch (eventType) {
      case 'PROCESS_NILK': {
        const { amount, description } = data as z.infer<typeof ProcessNilkDataSchema>;
        let finalAmount = amount;

        if (userProfile.raw_nilk_balance < amount) throw new Error("Insufficient raw nilk.");

        if (userProfile.active_flask === 'YIELD_BOOST') {
            finalAmount = Math.floor(amount * (1 + FLASK_EFFECTS.YIELD_BOOST.bonus));
        }

        const { error: rpcError } = await supabase.rpc('process_and_log_nilk', {
            p_user_id: userId,
            p_raw_nilk_to_spend: amount,
            p_nilk_to_mint: finalAmount,
            p_description: description || `User processed ${amount} Raw Nilk into ${finalAmount} $NILK` + (finalAmount > amount ? ' (Yield Boost Active)' : ''),
        });

        if (rpcError) throw rpcError;

        responseData = { message: `Successfully processed ${finalAmount} NILK.` };
        break;
      }

      case 'PERFORM_FUSION': {
        const { description, outputTier } = data as z.infer<typeof PerformFusionDataSchema>;
        const fusionFee = COW_STATS[outputTier]?.fusionFee;
        if (!fusionFee) throw new Error(`Invalid outputTier specified for fusion: ${outputTier}`);
        
        let finalCost = fusionFee;
        if (userProfile.active_flask === 'FUSION_FLUX') {
            finalCost = Math.floor(finalCost * (1 - FLASK_EFFECTS.FUSION_FLUX.discount));
        }

        if (userProfile.nilk_balance < finalCost) {
          throw new Error(`Insufficient $NILK for fusion. Required: ${finalCost}, Have: ${userProfile.nilk_balance}`);
        }
        
        const { error: rpcError } = await supabase.rpc('fuse_and_log', {
            p_user_id: userId,
            p_nilk_to_burn: finalCost,
            p_description: description || `User performed a fusion into ${outputTier}, burning ${finalCost} $NILK` + (finalCost < fusionFee ? ' (Fusion Flux Active)' : ''),
        });

        if (rpcError) throw rpcError;
        
        responseData = { message: "Successfully tracked fusion and logged event." };
        break;
      }
      
      case 'CRAFT_FLASK': {
        const { flaskType, description } = data as z.infer<typeof CraftFlaskDataSchema>;
        const costs = FLASK_COSTS[flaskType];

        if (userProfile.raw_nilk_balance < costs.raw_nilk || userProfile.nilk_balance < costs.nilk) {
          throw new Error(`Insufficient resources to craft ${flaskType}.`);
        }

        // Use a transaction (via RPC) to ensure atomicity
        const { error: rpcError } = await supabase.rpc('craft_and_log_item', {
            p_user_id: userId,
            p_nilk_cost: costs.nilk,
            p_raw_nilk_cost: costs.raw_nilk,
            p_item_to_add: flaskType,
            p_description: description || `User crafted ${flaskType}`
        });

        if (rpcError) throw rpcError;
        
        responseData = { message: `Successfully crafted ${flaskType}.` };
        break;
      }
      
      case 'ACTIVATE_FLASK': {
        const { flaskType } = data as z.infer<typeof ActivateFlaskDataSchema>;
        
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

        const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', userId);

        if (updateError) throw updateError;

        responseData = { message: `${flaskType} has been activated.` };
        break;
      }
        
      case 'EARN_HYPE': {
        const { amount, description } = data as z.infer<typeof EarnHypeDataSchema>;
        
        const { error: rpcError } = await supabase.rpc('earn_hype_and_log', {
            p_user_id: userId,
            p_amount: amount,
            p_description: description || 'User earned HYPE from an achievement or reward',
        });

        if (rpcError) throw rpcError;

        responseData = { message: "Successfully tracked HYPE earnings." };
        break;
      }

      default:
        // This case should not be reachable due to Zod validation
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
    console.error(error); // Log the full error for debugging
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 