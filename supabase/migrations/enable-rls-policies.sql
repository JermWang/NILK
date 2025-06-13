-- enable-rls-policies.sql
-- This script enables Row Level Security (RLS) on all critical user data tables
-- and applies strict policies to ensure users can only access their own data.
-- This is a critical security measure to protect user data.

-- Step 1: Enable RLS on all relevant tables.
-- It might have been disabled during initial development.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies for the 'profiles' table.
-- Users can see their own profile.
CREATE POLICY "Enable read access for users on their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile.
CREATE POLICY "Enable update access for users on their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No one can insert new profiles directly except through the handle_new_user trigger.
-- No one can delete profiles for now to maintain data integrity.


-- Step 3: Create policies for the 'user_stats' table.
-- Users can see their own stats.
CREATE POLICY "Enable read access for users on their own stats"
ON public.user_stats
FOR SELECT
USING (auth.uid() = user_id);

-- Backend service role will handle updates via RPC calls with `security definer`.
-- No direct inserts, updates, or deletes from the client.


-- Step 4: Create policies for the 'economic_events' table.
-- Users can see their own economic events if needed.
CREATE POLICY "Enable read access for users on their own economic events"
ON public.economic_events
FOR SELECT
USING (auth.uid() = user_id);

-- The 'economic_events' are append-only and should only be created by the backend.
-- The RPC functions are `security definer`, so they can bypass these policies.
-- We explicitly deny client-side inserts, updates, or deletes.
CREATE POLICY "Deny client-side inserts on economic_events"
ON public.economic_events
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny client-side updates on economic_events"
ON public.economic_events
FOR UPDATE
USING (false);

CREATE POLICY "Deny client-side deletes on economic_events"
ON public.economic_events
FOR DELETE
USING (false);


-- Step 5: Handle Public-Facing Functions
-- The `get_leaderboard` function should be accessible to everyone.
-- We change it to `SECURITY INVOKER` so it runs with the permissions of the calling user.
-- The underlying tables (`user_stats`, `profiles`) already have RLS, but a join can expose data.
-- To be safe, we'll make the leaderboard function `SECURITY DEFINER` but only select non-sensitive data.
-- The current function already does this, so we just ensure it's defined correctly.
DROP FUNCTION IF EXISTS public.get_leaderboard();
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(rank bigint, username text, raw_nilk_processed numeric, fusions integer, hype_earned numeric)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the function owner, bypassing RLS.
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CAST(RANK() OVER (ORDER BY us.raw_nilk_processed DESC, us.fusions DESC, us.hype_earned DESC) AS BIGINT) as rank,
        p.username,
        us.raw_nilk_processed,
        us.fusions,
        us.hype_earned
    FROM
        public.user_stats us
    JOIN
        public.profiles p ON us.user_id = p.id
    ORDER BY
        rank
    LIMIT 100;
END;
$$;
-- Grant execute access to authenticated users.
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;


-- The `get_economic_summary` function should only be for admins.
-- We can lock it down by revoking execute from public and granting only to a new 'admin' role.
-- (Assuming an 'admin' role is created and assigned to specific users)
REVOKE EXECUTE ON FUNCTION public.get_economic_summary() FROM public, authenticated, anon;
-- Example: GRANT EXECUTE ON FUNCTION public.get_economic_summary() TO admin;

-- Granting USAGE on the schema to the necessary roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; 