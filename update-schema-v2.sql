-- Version 2 Schema Updates for NILKhype
-- This script adds tables and columns to support advanced leaderboard and admin dashboard features.

-- 1. Add HYPE balance to the user_balances table
ALTER TABLE public.user_balances
ADD COLUMN IF NOT EXISTS hype_balance float8 NOT NULL DEFAULT 0;

-- 2. Create a dedicated table for user statistics to support the leaderboard
-- First, drop the table if it exists to avoid type conflicts
DROP TABLE IF EXISTS public.user_stats CASCADE;

CREATE TABLE public.user_stats (
    user_id uuid NOT NULL,
    raw_nilk_processed float8 NOT NULL DEFAULT 0,
    fusion_count int4 NOT NULL DEFAULT 0,
    hype_earned float8 NOT NULL DEFAULT 0, -- Total HYPE earned from achievements, etc.
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_stats_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);

-- Note: For a real-world scenario, you would re-enable RLS with appropriate policies.
-- For now, mirroring the existing setup.
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;

-- Add a function to initialize stats for a new user, to be called from handle_new_user
CREATE OR REPLACE FUNCTION public.initialize_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 3. Create a table to log major economic events for the admin dashboard
-- First, drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.economic_events CASCADE;

CREATE TABLE public.economic_events (
    id bigserial PRIMARY KEY,
    event_type text NOT NULL, -- e.g., 'MINT_NILK', 'BURN_NILK_FUSION', 'TREASURY_FEE'
    user_id uuid NULL, -- Nullable because some events might be purely systemic
    amount float8 NOT NULL,
    currency text NOT NULL, -- e.g., 'NILK', 'HYPE', 'RAW_NILK'
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT economic_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX idx_economic_events_event_type ON public.economic_events(event_type);
CREATE INDEX idx_economic_events_created_at ON public.economic_events(created_at);

-- Note: For a real-world scenario, you would re-enable RLS with appropriate policies.
ALTER TABLE public.economic_events DISABLE ROW LEVEL SECURITY;

-- 4. Create RPC functions to be called by the track-event Edge Function
CREATE OR REPLACE FUNCTION public.increment_raw_nilk_processed(p_user_id uuid, p_amount float8)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, raw_nilk_processed)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    raw_nilk_processed = user_stats.raw_nilk_processed + p_amount, 
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_fusion_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, fusion_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    fusion_count = user_stats.fusion_count + 1, 
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_hype(p_user_id uuid, p_amount float8)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update stats table for total earned
  INSERT INTO public.user_stats (user_id, hype_earned)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    hype_earned = user_stats.hype_earned + p_amount, 
    updated_at = now();

  -- Update balance table for current spendable balance
  UPDATE public.user_balances
  SET hype_balance = hype_balance + p_amount
  WHERE user_id = p_user_id;
END;
$$;

-- 5. Update the get_leaderboard function to use the new stats table
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank bigint,
  wallet_address text,
  username text,
  raw_nilk_processed float8,
  hype_earned float8,
  fusion_count int4,
  avatar_url text,
  x_handle text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    RANK() OVER (ORDER BY s.raw_nilk_processed DESC, s.hype_earned DESC) as rank,
    p.wallet_address,
    p.username,
    s.raw_nilk_processed,
    s.hype_earned,
    s.fusion_count,
    p.avatar_url,
    p.x_handle
  FROM
    public.user_stats s
  JOIN
    public.profiles p ON s.user_id = p.id
  ORDER BY
    rank
  LIMIT 100; -- Limit to top 100 players for performance
END;
$$;

-- 6. Modify the handle_new_user function to include new stats table initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, username, wallet_address)
  VALUES (new.id, new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'wallet_address');
  
  -- Create Balances
  INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance, hype_balance)
  VALUES (new.id, 100000, 0, 0); -- Initial balances, including HYPE
  
  -- Create Machines
  INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
  VALUES (new.id, 0, 0);
  
  -- Create Upgrades
  INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
  VALUES (new.id, 0, false, false);
  
  -- Create Stats
  INSERT INTO public.user_stats (user_id, raw_nilk_processed, fusion_count, hype_earned)
  VALUES (new.id, 0, 0, 0);

  RETURN new;
END;
$$;

-- Note: The trigger on auth.users for handle_new_user is already in schema.sql.
-- Re-applying it here is not necessary unless the original schema is not run first.
 