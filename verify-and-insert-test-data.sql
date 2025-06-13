-- Verify database setup and insert test data
-- Run this in your Supabase SQL editor

-- 1. Check if tables exist and show their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'user_balances', 'user_cows', 'user_machines', 'user_upgrades', 'harvest_history')
ORDER BY table_name, ordinal_position;

-- 2. Check current data in tables
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'user_balances' as table_name, count(*) as row_count FROM public.user_balances
UNION ALL
SELECT 'user_cows' as table_name, count(*) as row_count FROM public.user_cows
UNION ALL
SELECT 'user_machines' as table_name, count(*) as row_count FROM public.user_machines
UNION ALL
SELECT 'user_upgrades' as table_name, count(*) as row_count FROM public.user_upgrades
UNION ALL
SELECT 'harvest_history' as table_name, count(*) as row_count FROM public.harvest_history
ORDER BY table_name;

-- 3. Insert test data if tables are empty
DO $$
DECLARE
    test_user_id bigint := 1234567890123456789;
    test_wallet text := '0x1234567890123456789012345678901234567890';
    profile_count int;
    balance_count int;
    machine_count int;
    upgrade_count int;
BEGIN
    -- Check if test data already exists
    SELECT count(*) INTO profile_count FROM public.profiles WHERE id = test_user_id;
    SELECT count(*) INTO balance_count FROM public.user_balances WHERE user_id = test_user_id;
    SELECT count(*) INTO machine_count FROM public.user_machines WHERE user_id = test_user_id;
    SELECT count(*) INTO upgrade_count FROM public.user_upgrades WHERE user_id = test_user_id;
    
    -- Insert test profile if it doesn't exist
    IF profile_count = 0 THEN
        INSERT INTO public.profiles (id, username, wallet_address, updated_at)
        VALUES (test_user_id, 'TestUser', test_wallet, now());
        RAISE NOTICE 'Inserted test profile for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test profile already exists for user: %', test_user_id;
    END IF;
    
    -- Insert test balances if they don't exist
    IF balance_count = 0 THEN
        INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance)
        VALUES (test_user_id, 100000, 0);
        RAISE NOTICE 'Inserted test balances for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test balances already exist for user: %', test_user_id;
    END IF;
    
    -- Insert test machines if they don't exist
    IF machine_count = 0 THEN
        INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
        VALUES (test_user_id, 0, 0);
        RAISE NOTICE 'Inserted test machines for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test machines already exist for user: %', test_user_id;
    END IF;
    
    -- Insert test upgrades if they don't exist
    IF upgrade_count = 0 THEN
        INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
        VALUES (test_user_id, 0, false, false);
        RAISE NOTICE 'Inserted test upgrades for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test upgrades already exist for user: %', test_user_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting test data: %', SQLERRM;
END $$;

-- 4. Verify the test data was inserted
SELECT 
    p.id,
    p.username,
    p.wallet_address,
    b.nilk_balance,
    b.raw_nilk_balance,
    m.standard_machines,
    m.pro_machines,
    u.yield_booster_level,
    u.has_moofi_badge,
    u.has_alien_farmer_boost
FROM public.profiles p
LEFT JOIN public.user_balances b ON p.id = b.user_id
LEFT JOIN public.user_machines m ON p.id = m.user_id
LEFT JOIN public.user_upgrades u ON p.id = u.user_id
WHERE p.id = 1234567890123456789;

-- 5. Final status
SELECT 'Test data verification and insertion completed!' as status; 