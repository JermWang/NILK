-- Fixed database setup for NILK Game - working with existing Supabase profiles structure
-- Run this in your Supabase SQL editor

-- 1. First, let's check the current profiles table structure
DO $$
BEGIN
    -- Add missing columns to profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'wallet_address') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_address text;
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_wallet_address_key ON public.profiles(wallet_address);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Drop existing game tables if they exist (to recreate with correct structure)
DROP TABLE IF EXISTS public.harvest_history CASCADE;
DROP TABLE IF EXISTS public.user_cows CASCADE;
DROP TABLE IF EXISTS public.user_machines CASCADE;
DROP TABLE IF EXISTS public.user_upgrades CASCADE;
DROP TABLE IF EXISTS public.user_balances CASCADE;

-- 3. Create user_balances table (using profile.id as foreign key)
CREATE TABLE public.user_balances (
    user_id bigint NOT NULL,
    nilk_balance float8 NOT NULL DEFAULT 100000,
    raw_nilk_balance float8 NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_balances_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. Create user_cows table
CREATE TABLE public.user_cows (
    id text NOT NULL,
    user_id bigint NOT NULL,
    tier text NOT NULL CHECK (tier IN ('common', 'cosmic', 'galactic_moo_moo')),
    level int4 NOT NULL DEFAULT 1,
    last_harvest_time timestamptz NOT NULL DEFAULT now(),
    accumulated_raw_nilk float8 NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_cows_pkey PRIMARY KEY (id),
    CONSTRAINT user_cows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 5. Create user_machines table
CREATE TABLE public.user_machines (
    user_id bigint NOT NULL,
    standard_machines int4 NOT NULL DEFAULT 0,
    pro_machines int4 NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_machines_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_machines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 6. Create user_upgrades table
CREATE TABLE public.user_upgrades (
    user_id bigint NOT NULL,
    yield_booster_level int4 NOT NULL DEFAULT 0,
    has_moofi_badge bool NOT NULL DEFAULT false,
    has_alien_farmer_boost bool NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_upgrades_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_upgrades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 7. Create harvest_history table
CREATE TABLE public.harvest_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL,
    cow_id text NOT NULL,
    raw_nilk_harvested float8 NOT NULL,
    harvested_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT harvest_history_pkey PRIMARY KEY (id),
    CONSTRAINT harvest_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 8. Create indexes for better performance
CREATE INDEX idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX idx_user_cows_user_id ON public.user_cows(user_id);
CREATE INDEX idx_user_cows_tier ON public.user_cows(tier);
CREATE INDEX idx_user_machines_user_id ON public.user_machines(user_id);
CREATE INDEX idx_user_upgrades_user_id ON public.user_upgrades(user_id);
CREATE INDEX idx_harvest_history_user_id ON public.harvest_history(user_id);
CREATE INDEX idx_harvest_history_harvested_at ON public.harvest_history(harvested_at);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);

-- 9. Disable RLS for development (enable in production with proper policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_history DISABLE ROW LEVEL SECURITY;

-- 10. Drop any existing RLS policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_balances', 'user_cows', 'user_machines', 'user_upgrades', 'harvest_history')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 11. Create helper functions for wallet-based operations

-- Function to get or create user by wallet address
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_wallet(wallet_addr text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id bigint;
BEGIN
    -- Try to find existing user
    SELECT id INTO v_user_id 
    FROM public.profiles 
    WHERE wallet_address = wallet_addr;
    
    -- If not found, create new user
    IF v_user_id IS NULL THEN
        INSERT INTO public.profiles (username, wallet_address, updated_at)
        VALUES (
            'User_' || substring(wallet_addr from 39 for 6), -- Last 6 chars of wallet
            wallet_addr,
            now()
        )
        RETURNING id INTO v_user_id;
        
        -- Create initial game data for new user
        INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance)
        VALUES (v_user_id, 100000, 0);
        
        INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
        VALUES (v_user_id, 0, 0);
        
        INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
        VALUES (v_user_id, 0, false, false);
        
        RAISE NOTICE 'Created new user with ID: % for wallet: %', v_user_id, wallet_addr;
    ELSE
        -- Update last seen time
        UPDATE public.profiles 
        SET updated_at = now() 
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Found existing user with ID: % for wallet: %', v_user_id, wallet_addr;
    END IF;
    
    RETURN v_user_id;
END;
$$;

-- Function to get user game state by wallet address
CREATE OR REPLACE FUNCTION public.get_user_game_state(wallet_addr text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id bigint;
    game_state json;
BEGIN
    -- Get user ID
    v_user_id := public.get_or_create_user_by_wallet(wallet_addr);
    
    -- Build game state JSON
    SELECT json_build_object(
        'userNilkBalance', COALESCE(b.nilk_balance, 100000),
        'userRawNilkBalance', COALESCE(b.raw_nilk_balance, 0),
        'ownedCows', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'tier', c.tier,
                    'level', c.level,
                    'lastHarvestTime', extract(epoch from c.last_harvest_time) * 1000,
                    'accumulatedRawNilk', c.accumulated_raw_nilk
                )
            ) FROM public.user_cows c WHERE c.user_id = v_user_id),
            '[]'::json
        ),
        'ownedMachines', json_build_object(
            'standard', COALESCE(m.standard_machines, 0),
            'pro', COALESCE(m.pro_machines, 0)
        ),
        'yieldBoosterLevel', COALESCE(u.yield_booster_level, 0),
        'hasMoofiBadge', COALESCE(u.has_moofi_badge, false),
        'hasAlienFarmerBoost', COALESCE(u.has_alien_farmer_boost, false)
    ) INTO game_state
    FROM public.profiles p
    LEFT JOIN public.user_balances b ON p.id = b.user_id
    LEFT JOIN public.user_machines m ON p.id = m.user_id
    LEFT JOIN public.user_upgrades u ON p.id = u.user_id
    WHERE p.id = v_user_id;
    
    RETURN game_state;
END;
$$;

-- 12. Create leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
    username text,
    wallet_address text,
    nilk_balance float8,
    rank bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.username,
        p.wallet_address,
        b.nilk_balance,
        RANK() OVER (ORDER BY b.nilk_balance DESC) as rank
    FROM
        public.user_balances b
    JOIN
        public.profiles p ON b.user_id = p.id
    WHERE
        p.wallet_address IS NOT NULL
    ORDER BY
        b.nilk_balance DESC
    LIMIT 100;
END;
$$;

-- 13. Test the setup
DO $$
DECLARE
    test_wallet text := '0x1234567890123456789012345678901234567890';
    test_user_id bigint;
    test_state json;
BEGIN
    -- Test user creation
    test_user_id := public.get_or_create_user_by_wallet(test_wallet);
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- Test game state retrieval
    test_state := public.get_user_game_state(test_wallet);
    RAISE NOTICE 'Test game state: %', test_state;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during testing: %', SQLERRM;
END $$;

-- 14. Verify the setup
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

-- 15. Final status
SELECT 'Database setup completed successfully! Ready for wallet-based authentication.' as status; 