-- add-atomic-functions.sql

-- Function to process raw nilk, mint nilk, and log the event atomically
create or replace function process_and_log_nilk(
    p_user_id uuid,
    p_raw_nilk_to_spend numeric,
    p_nilk_to_mint numeric,
    p_description text
)
returns void
language plpgsql
security definer
volatile
as $$
begin
    -- 1. Update balances in the single source of truth: profiles table
    update public.profiles
    set
        raw_nilk_balance = raw_nilk_balance - p_raw_nilk_to_spend,
        nilk_balance = nilk_balance + p_nilk_to_mint
    where id = p_user_id;

    -- 2. Update aggregated stats for the leaderboard
    update public.user_stats
    set raw_nilk_processed = raw_nilk_processed + p_nilk_to_mint
    where user_id = p_user_id;

    -- 3. Log the economic event
    insert into public.economic_events(event_type, user_id, amount, currency, description)
    values ('MINT_NILK', p_user_id, p_nilk_to_mint, 'NILK', p_description);
end;
$$;


-- Function to handle fusion costs and log the event atomically
create or replace function fuse_and_log(
    p_user_id uuid,
    p_nilk_to_burn numeric,
    p_description text
)
returns void
language plpgsql
security definer
volatile
as $$
begin
    -- 1. Deduct the fusion cost from the user's nilk balance in the profiles table
    update public.profiles
    set nilk_balance = nilk_balance - p_nilk_to_burn
    where id = p_user_id;

    -- 2. Increment the user's fusion count in the stats table
    update public.user_stats
    set fusions = fusions + 1
    where user_id = p_user_id;

    -- 3. Log the nilk burn event
    insert into public.economic_events(event_type, user_id, amount, currency, description)
    values ('BURN_NILK_FUSION', p_user_id, p_nilk_to_burn, 'NILK', p_description);
end;
$$;


-- Function to handle crafting costs and log the event atomically
create or replace function craft_and_log_item(
    p_user_id uuid,
    p_nilk_cost numeric,
    p_raw_nilk_cost numeric,
    p_item_to_add text,
    p_description text
)
returns void
language plpgsql
security definer
volatile
as $$
begin
    -- 1. Deduct resources from the user's profile
    update public.profiles
    set
        nilk_balance = nilk_balance - p_nilk_cost,
        raw_nilk_balance = raw_nilk_balance - p_raw_nilk_cost,
        flask_inventory = array_append(flask_inventory, p_item_to_add)
    where id = p_user_id;

    -- 2. Log the crafting event (as a NILK burn/spend)
    insert into public.economic_events(event_type, user_id, amount, currency, description)
    values ('CRAFT_ITEM', p_user_id, p_nilk_cost, 'NILK', p_description);
end;
$$;

-- Function to award HYPE and log the event atomically
create or replace function earn_hype_and_log(
    p_user_id uuid,
    p_amount numeric,
    p_description text
)
returns void
language plpgsql
security definer
volatile
as $$
begin
    -- 1. Add HYPE to the user's balance in the profiles table
    update public.profiles
    set hype_balance = hype_balance + p_amount
    where id = p_user_id;

    -- 2. Update total HYPE earned in user_stats for leaderboards
    update public.user_stats
    set hype_earned = hype_earned + p_amount
    where user_id = p_user_id;

    -- 3. Log the HYPE earning event
    insert into public.economic_events(event_type, user_id, amount, currency, description)
    values ('EARN_HYPE', p_user_id, p_amount, 'HYPE', p_description);
end;
$$; 