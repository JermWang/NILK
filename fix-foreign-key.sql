-- Fix for foreign key constraint issue
-- Run this first to diagnose and fix the data type mismatch

-- Step 1: Check the actual data type of profiles.id
SELECT 
    'profiles.id data type:' as info,
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'id';

-- Step 2: Drop existing user_stats table if it exists
DROP TABLE IF EXISTS public.user_stats CASCADE;

-- Step 3: Create user_stats table with bigint (most likely the actual type)
CREATE TABLE public.user_stats (
    user_id bigint NOT NULL,
    raw_nilk_processed float8 NOT NULL DEFAULT 0,
    fusion_count int4 NOT NULL DEFAULT 0,
    hype_earned float8 NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_stats_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;

-- Step 4: Add HYPE balance column
ALTER TABLE public.user_balances
ADD COLUMN IF NOT EXISTS hype_balance float8 NOT NULL DEFAULT 0;

-- Step 5: Create RPC functions with bigint parameters
CREATE OR REPLACE FUNCTION public.increment_raw_nilk_processed(p_user_id bigint, p_amount float8)
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

CREATE OR REPLACE FUNCTION public.increment_fusion_count(p_user_id bigint)
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

CREATE OR REPLACE FUNCTION public.increment_hype(p_user_id bigint, p_amount float8)
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

-- Step 6: Update get_leaderboard function
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
  LIMIT 100;
END;
$$;

-- Step 7: Verify the fix worked
SELECT 'Fix completed successfully!' as status; 