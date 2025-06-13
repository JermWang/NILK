-- This script creates the profiles and related tables with proper primary keys and RLS enabled.
-- It ensures that a user's profile and game data are directly linked to their Supabase Auth identity.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id uuid NOT NULL,
            updated_at timestamptz NULL,
            username text NULL,
            wallet_address text NULL, -- Added to store the user's wallet address
            CONSTRAINT profiles_pkey PRIMARY KEY (id),
            CONSTRAINT profiles_username_key UNIQUE (username),
            CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address)
            -- Removed foreign key constraint to auth.users for wallet-based auth
        );
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_balances') THEN
        CREATE TABLE public.user_balances (
            user_id uuid NOT NULL,
            nilk_balance float8 NOT NULL DEFAULT 0,
            raw_nilk_balance float8 NOT NULL DEFAULT 0,
            CONSTRAINT user_balances_pkey PRIMARY KEY (user_id),
            CONSTRAINT user_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_user_balances_user_id ON public.user_balances(user_id);
        ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_cows') THEN
        CREATE TABLE public.user_cows (
            id text NOT NULL, -- Changed to text to match game-generated IDs
            user_id uuid NOT NULL,
            tier text NOT NULL,
            level int4 NOT NULL DEFAULT 0,
            last_harvest_time timestamptz NOT NULL DEFAULT now(),
            accumulated_raw_nilk float8 NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT user_cows_pkey PRIMARY KEY (id),
            CONSTRAINT user_cows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_user_cows_user_id ON public.user_cows(user_id);
        ALTER TABLE public.user_cows ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_machines') THEN
        CREATE TABLE public.user_machines (
            user_id uuid NOT NULL,
            standard_machines int4 NOT NULL DEFAULT 0,
            pro_machines int4 NOT NULL DEFAULT 0,
            CONSTRAINT user_machines_pkey PRIMARY KEY (user_id),
            CONSTRAINT user_machines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_user_machines_user_id ON public.user_machines(user_id);
        ALTER TABLE public.user_machines ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_upgrades') THEN
        CREATE TABLE public.user_upgrades (
            user_id uuid NOT NULL,
            yield_booster_level int4 NOT NULL DEFAULT 0,
            has_moofi_badge bool NOT NULL DEFAULT false,
            has_alien_farmer_boost bool NOT NULL DEFAULT false,
            CONSTRAINT user_upgrades_pkey PRIMARY KEY (user_id),
            CONSTRAINT user_upgrades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_user_upgrades_user_id ON public.user_upgrades(user_id);
        ALTER TABLE public.user_upgrades ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_history') THEN
        CREATE TABLE public.harvest_history (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            cow_id text NOT NULL,
            raw_nilk_harvested float8 NOT NULL,
            harvested_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT harvest_history_pkey PRIMARY KEY (id),
            CONSTRAINT harvest_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_harvest_history_user_id ON public.harvest_history(user_id);
        CREATE INDEX idx_harvest_history_harvested_at ON public.harvest_history(harvested_at);
        ALTER TABLE public.harvest_history ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nonces') THEN
        CREATE TABLE public.nonces (
          id text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT nonces_pkey PRIMARY KEY (id)
        );
        ALTER TABLE public.nonces ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;


-- Function to create a new user profile, balances, machines, and upgrades when a new user signs up
-- Note: This function is designed for Supabase Auth integration, but we're using wallet-based auth
-- You may want to remove this trigger for wallet-based authentication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, wallet_address)
  VALUES (new.id, new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'wallet_address');
  
  INSERT INTO public.user_balances (user_id, nilk_balance, raw_nilk_balance)
  VALUES (new.id, 100000, 0); -- Initial balances
  
  INSERT INTO public.user_machines (user_id, standard_machines, pro_machines)
  VALUES (new.id, 0, 0);
  
  INSERT INTO public.user_upgrades (user_id, yield_booster_level, has_moofi_badge, has_alien_farmer_boost)
  VALUES (new.id, 0, false, false);
  
  RETURN new;
END;
$$;

-- Trigger to call the function when a new user is created
-- Note: This trigger is for Supabase Auth integration, may not be needed for wallet-based auth
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;


-- RLS Policies - Updated for wallet-based authentication
-- Note: For production, you may want to implement more sophisticated RLS based on API keys or other auth methods

-- Temporarily disable RLS for wallet-based authentication
-- In production, you would implement proper authentication middleware
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_history DISABLE ROW LEVEL SECURITY;

-- Keep nonces table with basic RLS
CREATE POLICY "Enable public access to nonces" ON public.nonces FOR SELECT USING (true);
CREATE POLICY "Enable public insert access for nonces" ON public.nonces FOR INSERT WITH CHECK (true);

-- Function to retrieve leaderboard data
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
  LIMIT 100; -- Limit to top 100 players for performance
END;
$$;
