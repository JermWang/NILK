-- Update script for existing Supabase database to support wallet-based authentication
-- Run this in your Supabase SQL editor

-- 1. Remove the foreign key constraint from profiles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_id_fkey' 
               AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Removed foreign key constraint from profiles table';
    END IF;
END $$;

-- 2. Disable RLS on all tables for wallet-based authentication
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_history DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.profiles;
DROP POLICY IF EXISTS "Enable individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Enable individual read access" ON public.user_balances;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.user_balances;
DROP POLICY IF EXISTS "Enable individual update access" ON public.user_balances;
DROP POLICY IF EXISTS "Enable individual read access" ON public.user_cows;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.user_cows;
DROP POLICY IF EXISTS "Enable individual update access" ON public.user_cows;
DROP POLICY IF EXISTS "Enable individual delete access" ON public.user_cows;
DROP POLICY IF EXISTS "Enable individual read access" ON public.user_machines;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.user_machines;
DROP POLICY IF EXISTS "Enable individual update access" ON public.user_machines;
DROP POLICY IF EXISTS "Enable individual read access" ON public.user_upgrades;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.user_upgrades;
DROP POLICY IF EXISTS "Enable individual update access" ON public.user_upgrades;
DROP POLICY IF EXISTS "Enable individual read access" ON public.harvest_history;
DROP POLICY IF EXISTS "Enable individual insert access" ON public.harvest_history;
DROP POLICY IF EXISTS "Enable individual insert access for nonces";

-- 4. Create simple policies for nonces table
CREATE POLICY "Enable public access to nonces" ON public.nonces FOR SELECT USING (true);
CREATE POLICY "Enable public insert access for nonces" ON public.nonces FOR INSERT WITH CHECK (true);

-- 5. Verify tables exist and show their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'user_balances', 'user_cows', 'user_machines', 'user_upgrades', 'harvest_history')
ORDER BY table_name, ordinal_position;

-- 6. Test data insertion (optional - remove if you don't want test data)
-- This will test if the UUID format works correctly
DO $$
DECLARE
    test_user_id uuid := '12345678-9012-4345-8678-901234567890';
BEGIN
    -- Try to insert a test profile
    INSERT INTO public.profiles (id, username, wallet_address, updated_at)
    VALUES (test_user_id, 'TestUser', '0x1234567890123456789012345678901234567890', now())
    ON CONFLICT (id) DO UPDATE SET updated_at = now();
    
    -- Try to insert test balances
    INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance)
    VALUES (test_user_id, 100000, 0)
    ON CONFLICT (user_id) DO UPDATE SET nilk_balance = 100000, raw_nilk_balance = 0;
    
    -- Try to insert test machines
    INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
    VALUES (test_user_id, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET standard_machines = 0, pro_machines = 0;
    
    -- Try to insert test upgrades
    INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
    VALUES (test_user_id, 0, false, false)
    ON CONFLICT (user_id) DO UPDATE SET yield_booster_level = 0, has_moofi_badge = false, has_alien_farmer_boost = false;
    
    RAISE NOTICE 'Test data inserted successfully for user: %', test_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting test data: %', SQLERRM;
END $$;

-- 7. Show final status
SELECT 'Database update completed successfully' as status; 