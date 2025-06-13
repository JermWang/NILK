import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { SiweMessage } from "https://esm.sh/siwe@2.1.4";
import { corsHeaders } from "../_shared/cors.ts";

interface LoginPayload {
  message: string;
  signature: string;
  walletAddress: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, signature, walletAddress }: LoginPayload = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Verify the SIWE message and signature
    const siweMessage = new SiweMessage(message);
    const { data: fields, error: validationError } = await siweMessage.verify({ signature });

    if (validationError) throw new Error(`SIWE validation failed: ${validationError.message}`);
    if (fields.address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("SIWE address does not match wallet address.");
    }
    
    // --- At this point, the user is authenticated ---
    const userId = fields.address; // Use the verified address as the user ID

    // 2. Fetch or create the user's profile
    let { data: userProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*, cow_inventory(*)')
      .eq('wallet_address', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 'Not a single row was returned'
        throw fetchError;
    }

    if (!userProfile) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ wallet_address: userId, username: `user_${userId.slice(0, 6)}` })
            .select('*, cow_inventory(*)')
            .single();
        if (createError) throw createError;
        userProfile = newProfile;
    }

    // 3. Calculate passive Raw Nilk generation
    const now = new Date();
    const lastActive = userProfile.last_active_timestamp ? new Date(userProfile.last_active_timestamp) : now;
    const timeDiffSeconds = Math.max(0, (now.getTime() - lastActive.getTime()) / 1000);
    
    const numberOfCows = userProfile.cow_inventory?.length || 0;
    const generationRatePerCowPerSecond = (COW_STATS.common.rawNilkPerDayBase / (24 * 60 * 60)) * (userProfile.raw_nilk_generation_rate || 1.0);
    
    const nilkGenerated = timeDiffSeconds * numberOfCows * generationRatePerCowPerSecond;

    if (nilkGenerated > 0) {
      // 4. Update profile with new Nilk and timestamp
      const newRawNilkBalance = (userProfile.raw_nilk_balance || 0) + nilkGenerated;
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ raw_nilk_balance: newRawNilkBalance, last_active_timestamp: now.toISOString() })
        .eq('wallet_address', userId)
        .select('*')
        .single();
      
      if (updateError) throw updateError;

      // Log the passive generation as an economic event
      await supabase.from('economic_events').insert({
        event_type: 'PASSIVE_NILK_GENERATION',
        user_id: userId,
        amount: nilkGenerated,
        currency: 'RAW_NILK',
        description: `User earned ${nilkGenerated.toFixed(2)} Raw Nilk from passive generation over ${timeDiffSeconds.toFixed(0)}s.`,
      });

      return new Response(JSON.stringify(updatedProfile), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
        // Just update timestamp
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ last_active_timestamp: now.toISOString() })
            .eq('wallet_address', userId)
            .select('*')
            .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedProfile), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

const COW_STATS = { // Simplified for this function
  common: { rawNilkPerDayBase: 150000 },
}; 