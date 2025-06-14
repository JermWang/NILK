// Import dependencies
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

// Define the shape of the incoming request payload
interface EventPayload {
  eventType: 'PROCESS_NILK' | 'PERFORM_FUSION' | 'EARN_HYPE';
  userId: string;
  data: {
    amount?: number;
    description?: string;
  };
}

serve(async (req) => {
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

    let responseData = {};

    switch (eventType) {
      case 'PROCESS_NILK': {
        // Increment raw_nilk_processed for the user
        const { error: rpcError } = await supabase.rpc('increment_raw_nilk_processed', {
          p_user_id: userId,
          p_amount: data.amount,
        });
        if (rpcError) throw rpcError;

        // Log the economic event for minting NILK
        const { error: eventError } = await supabase.from('economic_events').insert({
          event_type: 'MINT_NILK',
          user_id: userId,
          amount: data.amount,
          currency: 'NILK',
          description: data.description || 'User processed Raw Nilk into $NILK',
        });
        if (eventError) throw eventError;

        responseData = { message: "Successfully processed NILK and logged event." };
        break;
      }

      case 'PERFORM_FUSION': {
        // Increment fusion_count for the user
        const { error: rpcError } = await supabase.rpc('increment_fusion_count', {
          p_user_id: userId,
        });
        if (rpcError) throw rpcError;

        // Log the economic event for burning NILK
        const { error: eventError } = await supabase.from('economic_events').insert({
          event_type: 'BURN_NILK_FUSION',
          user_id: userId,
          amount: data.amount, // Amount of NILK burned
          currency: 'NILK',
          description: data.description || 'User performed a fusion, burning $NILK',
        });
        if (eventError) throw eventError;
        
        responseData = { message: "Successfully tracked fusion and logged event." };
        break;
      }
        
      case 'EARN_HYPE': {
        // Increment hype_earned and hype_balance
        const { error: rpcError } = await supabase.rpc('increment_hype', {
            p_user_id: userId,
            p_amount: data.amount,
        });
        if (rpcError) throw rpcError;

        // Log the economic event
        const { error: eventError } = await supabase.from('economic_events').insert({
            event_type: 'EARN_HYPE',
            user_id: userId,
            amount: data.amount,
            currency: 'HYPE',
            description: data.description || 'User earned HYPE from an achievement or reward',
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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 