-- Diagnostic script to check actual database structure
-- Run this in your Supabase SQL editor to see the current table structures

-- Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if profiles table exists and what its primary key type is
SELECT 
    t.table_name,
    kcu.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.key_column_usage kcu 
    ON t.table_name = kcu.table_name 
    AND t.table_schema = kcu.table_schema
JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name 
    AND kcu.table_schema = tc.table_schema
JOIN information_schema.columns c
    ON kcu.table_name = c.table_name
    AND kcu.column_name = c.column_name
    AND kcu.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_name = 'profiles'
    AND tc.constraint_type = 'PRIMARY KEY';

-- Check existing foreign key constraints that reference profiles
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'profiles'
    AND tc.table_schema = 'public';

-- Check if user_stats table already exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_stats'
ORDER BY ordinal_position; 