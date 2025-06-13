-- Add missing profile columns to the profiles table
DO $$
BEGIN
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE 'Added avatar_url column to profiles table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in profiles table';
  END IF;
  
  -- Add x_handle column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'x_handle') THEN
    ALTER TABLE public.profiles ADD COLUMN x_handle text;
    RAISE NOTICE 'Added x_handle column to profiles table';
  ELSE
    RAISE NOTICE 'x_handle column already exists in profiles table';
  END IF;
END $$; 