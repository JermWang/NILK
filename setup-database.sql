-- Complete database setup for NILK Game with wallet-based authentication
-- Run this in your Supabase SQL editor

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    updated_at timestamptz NULL DEFAULT now(),
    username text NULL,
    wallet_address text NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_username_key UNIQUE (username),
    CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address)
);

-- 2. Create user_balances table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_balances (
    user_id uuid NOT NULL,
    nilk_balance float8 NOT NULL DEFAULT 0,
    raw_nilk_balance float8 NOT NULL DEFAULT 0,
    CONSTRAINT user_balances_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. Create user_cows table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_cows (
    id text NOT NULL,
    user_id uuid NOT NULL,
    tier text NOT NULL,
    level int4 NOT NULL DEFAULT 0,
    last_harvest_time timestamptz NOT NULL DEFAULT now(),
    accumulated_raw_nilk float8 NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_cows_pkey PRIMARY KEY (id),
    CONSTRAINT user_cows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. Create user_machines table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_machines (
    user_id uuid NOT NULL,
    standard_machines int4 NOT NULL DEFAULT 0,
    pro_machines int4 NOT NULL DEFAULT 0,
    CONSTRAINT user_machines_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_machines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 5. Create user_upgrades table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_upgrades (
    user_id uuid NOT NULL,
    yield_booster_level int4 NOT NULL DEFAULT 0,
    has_moofi_badge bool NOT NULL DEFAULT false,
    has_alien_farmer_boost bool NOT NULL DEFAULT false,
    CONSTRAINT user_upgrades_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_upgrades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 6. Create harvest_history table (if not exists)
CREATE TABLE IF NOT EXISTS public.harvest_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    cow_id text NOT NULL,
    raw_nilk_harvested float8 NOT NULL,
    harvested_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT harvest_history_pkey PRIMARY KEY (id),
    CONSTRAINT harvest_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 7. Create nonces table (if not exists)
CREATE TABLE IF NOT EXISTS public.nonces (
    id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT nonces_pkey PRIMARY KEY (id)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cows_user_id ON public.user_cows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_machines_user_id ON public.user_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_upgrades_user_id ON public.user_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_history_user_id ON public.harvest_history(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_history_harvested_at ON public.harvest_history(harvested_at);

-- 9. Disable RLS for wallet-based authentication
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nonces DISABLE ROW LEVEL SECURITY;

-- 10. Drop any existing RLS policies that might conflict
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_balances', 'user_cows', 'user_machines', 'user_upgrades', 'harvest_history', 'nonces')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 11. Create leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
    username text,
    nilk_balance float8,
    rank bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.username,
        b.nilk_balance,
        RANK() OVER (ORDER BY b.nilk_balance DESC) as rank
    FROM
        public.user_balances b
    JOIN
        public.profiles p ON b.user_id = p.id
    ORDER BY
        b.nilk_balance DESC
    LIMIT 100;
END;
$$;

-- 12. Test the setup with sample data
DO $$
DECLARE
    test_user_id uuid := '12345678-9012-4345-8678-901234567890';
    test_wallet text := '0x1234567890123456789012345678901234567890';
BEGIN
    -- Insert test profile
    INSERT INTO public.profiles (id, username, wallet_address, updated_at)
    VALUES (test_user_id, 'TestUser', test_wallet, now())
    ON CONFLICT (id) DO UPDATE SET 
        username = EXCLUDED.username,
        wallet_address = EXCLUDED.wallet_address,
        updated_at = EXCLUDED.updated_at;
    
    -- Insert test balances
    INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance)
    VALUES (test_user_id, 100000, 0)
    ON CONFLICT (user_id) DO UPDATE SET 
        nilk_balance = EXCLUDED.nilk_balance,
        raw_nilk_balance = EXCLUDED.raw_nilk_balance;
    
    -- Insert test machines
    INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
    VALUES (test_user_id, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET 
        standard_machines = EXCLUDED.standard_machines,
        pro_machines = EXCLUDED.pro_machines;
    
    -- Insert test upgrades
    INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
    VALUES (test_user_id, 0, false, false)
    ON CONFLICT (user_id) DO UPDATE SET 
        yield_booster_level = EXCLUDED.yield_booster_level,
        has_moofi_badge = EXCLUDED.has_moofi_badge,
        has_alien_farmer_boost = EXCLUDED.has_alien_farmer_boost;
    
    RAISE NOTICE 'Test data setup completed for user: %', test_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error setting up test data: %', SQLERRM;
END $$;

-- 13. Verify the setup
SELECT 
    'profiles' as table_name,
    count(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
    'user_balances' as table_name,
    count(*) as row_count
FROM public.user_balances
UNION ALL
SELECT 
    'user_cows' as table_name,
    count(*) as row_count
FROM public.user_cows
UNION ALL
SELECT 
    'user_machines' as table_name,
    count(*) as row_count
FROM public.user_machines
UNION ALL
SELECT 
    'user_upgrades' as table_name,
    count(*) as row_count
FROM public.user_upgrades
UNION ALL
SELECT 
    'harvest_history' as table_name,
    count(*) as row_count
FROM public.harvest_history
ORDER BY table_name;

-- 14. Final status
SELECT 'Database setup completed successfully! All tables created and configured for wallet-based authentication.' as status; 