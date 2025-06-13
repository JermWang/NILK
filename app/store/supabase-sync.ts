import { supabase } from '@/lib/supabaseClient';
import { Cow, CowTier } from './useGameStore';

export interface SupabaseGameState {
  userNilkBalance: number;
  userRawNilkBalance: number;
  ownedCows: Cow[];
  ownedMachines: {
    standard: number;
    pro: number;
  };
  yieldBoosterLevel: number;
  hasMoofiBadge: boolean;
  hasAlienFarmerBoost: boolean;
  userProfile?: {
    username: string | null;
    avatarUrl: string | null;
    xHandle: string | null;
    isProfileComplete: boolean;
  };
}

export interface UserProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  x_handle?: string;
  wallet_address: string;
  updated_at?: string;
}

export interface HarvestRecord {
  id?: string;
  user_id: string;
  cow_id: string;
  raw_nilk_harvested: number;
  harvested_at: string;
}

// Helper functions for cow data transformation
function getCowNameByTier(tier: CowTier): string {
  const names = {
    common: "Common Cow",
    cosmic: "Cosmic Cow", 
    galactic_moo_moo: "Galactic Moo Moo"
  };
  return names[tier] || "Unknown Cow";
}

function getCowBaseProduction(tier: CowTier): number {
  const production = {
    common: 1000,
    cosmic: 3500,
    galactic_moo_moo: 15000
  };
  return production[tier] || 1000;
}

function getCowImageUrl(tier: CowTier): string {
  const images = {
    common: "/NILK COW.png",
    cosmic: "/cosmic cow.png",
    galactic_moo_moo: "/galactic moo moo.png"
  };
  return images[tier] || "/NILK COW.png";
}

/**
 * Adds missing profile columns to the database if they don't exist
 */
async function ensureProfileColumns(): Promise<void> {
  // The columns should be added manually via SQL script
  // This function is kept for future use if needed
  console.log('[Supabase Sync] Profile columns should be added via add-profile-columns.sql');
}

/**
 * Saves profile data to Supabase
 */
export async function saveProfileToSupabase(
  walletAddress: string,
  profileData: {
    username?: string;
    avatarUrl?: string;
    xHandle?: string;
  }
): Promise<boolean> {
  try {
    console.log('[Supabase Sync] Saving profile data for wallet:', walletAddress);
    
    // Ensure profile columns exist
    await ensureProfileColumns();
    
    // Get user ID
    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.error('[Supabase Sync] Could not get user ID for wallet:', walletAddress);
      return false;
    }

    // Update profile data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (profileData.username !== undefined) {
      updateData.username = profileData.username;
    }
    if (profileData.avatarUrl !== undefined) {
      updateData.avatar_url = profileData.avatarUrl;
    }
    if (profileData.xHandle !== undefined) {
      updateData.x_handle = profileData.xHandle;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[Supabase Sync] Error updating profile:', error);
      return false;
    }

    console.log('[Supabase Sync] Profile data saved successfully');
    return true;

  } catch (error) {
    console.error('[Supabase Sync] Error saving profile data:', error);
    return false;
  }
}

/**
 * Fetches profile data from Supabase
 */
export async function fetchProfileFromSupabase(walletAddress: string): Promise<UserProfile | null> {
  try {
    console.log('[Supabase Sync] Fetching profile data for wallet:', walletAddress);
    
    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.error('[Supabase Sync] Could not get user ID for wallet:', walletAddress);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Supabase Sync] Error fetching profile:', error);
      return null;
    }

    console.log('[Supabase Sync] Profile data fetched successfully:', data);
    return data as UserProfile;

  } catch (error) {
    console.error('[Supabase Sync] Error fetching profile data:', error);
    return null;
  }
}

/**
 * Creates or updates user profile
 */
export async function createOrUpdateUserProfile(
  walletAddress: string, 
  username?: string
): Promise<UserProfile | null> {
  try {
    console.log('[Supabase Sync] Creating/updating user profile for wallet:', walletAddress);

    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.error('[Supabase Sync] Could not get/create user ID for wallet:', walletAddress);
      return null;
    }

    console.log('[Supabase Sync] User ID:', userId);

    // If username was provided, update it
    if (username) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('[Supabase Sync] Error updating username:', updateError);
      }
    }

    // Fetch the complete profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[Supabase Sync] Error fetching profile:', fetchError);
      return null;
    }

    console.log('[Supabase Sync] Profile created/updated successfully:', profile);
    return profile as UserProfile;

  } catch (error) {
    console.error('[Supabase Sync] Unexpected error managing user profile:', error);
    return null;
  }
}

/**
 * Fetches initial game state from Supabase
 */
export async function fetchInitialGameState(walletAddress: string): Promise<SupabaseGameState | null> {
  try {
    console.log('[Supabase Sync] Fetching initial game state for wallet:', walletAddress);

    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.log('[Supabase Sync] No user found for wallet:', walletAddress);
      return null;
    }

    // Fetch all game data in parallel
    const [balancesResult, cowsResult, machinesResult, upgradesResult, profileData] = await Promise.all([
      supabase.from('user_balances').select('*').eq('user_id', userId).single(),
      supabase.from('user_cows').select('*').eq('user_id', userId),
      supabase.from('user_machines').select('*').eq('user_id', userId).single(),
      supabase.from('user_upgrades').select('*').eq('user_id', userId).single(),
      fetchProfileFromSupabase(walletAddress)
    ]);

    // Transform the data to match our game state format
    const gameState: SupabaseGameState = {
      userNilkBalance: balancesResult.data?.nilk_balance || 100000,
      userRawNilkBalance: balancesResult.data?.raw_nilk_balance || 0,
      ownedCows: (cowsResult.data || []).map((dbCow: any) => ({
        id: dbCow.id,
        tier: dbCow.tier as CowTier,
        name: getCowNameByTier(dbCow.tier as CowTier),
        rawNilkPerDayBase: getCowBaseProduction(dbCow.tier as CowTier),
        level: dbCow.level || 1,
        lastHarvestTime: new Date(dbCow.last_harvest_time).getTime() || Date.now(),
        accumulatedRawNilk: dbCow.accumulated_raw_nilk || 0,
        currentRawNilkPerDay: getCowBaseProduction(dbCow.tier as CowTier), // Will be recalculated
        imageUrl: getCowImageUrl(dbCow.tier as CowTier),
      })),
      ownedMachines: {
        standard: machinesResult.data?.standard_machines || 0,
        pro: machinesResult.data?.pro_machines || 0,
      },
      yieldBoosterLevel: upgradesResult.data?.yield_booster_level || 0,
      hasMoofiBadge: upgradesResult.data?.has_moofi_badge || false,
      hasAlienFarmerBoost: upgradesResult.data?.has_alien_farmer_boost || false,
      userProfile: profileData ? {
        username: profileData.username || null,
        avatarUrl: profileData.avatar_url || null,
        xHandle: profileData.x_handle || null,
        isProfileComplete: !!(profileData.username),
      } : {
        username: null,
        avatarUrl: null,
        xHandle: null,
        isProfileComplete: false,
      },
    };

    console.log('[Supabase Sync] Successfully fetched game state:', gameState);
    return gameState;

  } catch (error) {
    console.error('[Supabase Sync] Error fetching initial game state:', error);
    return null;
  }
}

/**
 * Gets user ID from wallet address
 */
async function getUserIdFromWallet(walletAddress: string): Promise<string | null> {
  try {
    // First try to find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      return existingUser.id.toString();
    }

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Supabase Sync] Error finding user:', findError);
      return null;
    }

    // Create new user if not found
    const addressHash = walletAddress.toLowerCase().replace('0x', '');
    const userIdFromWallet = [
      addressHash.substring(0, 8),
      addressHash.substring(8, 12),
      '4' + addressHash.substring(12, 15),
      '8' + addressHash.substring(15, 18),
      addressHash.substring(18, 30)
    ].join('-');

    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userIdFromWallet,
        wallet_address: walletAddress,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Supabase Sync] Error creating user:', createError);
      return null;
    }

    return newUser.id.toString();
  } catch (error) {
    console.error('[Supabase Sync] Error getting user ID:', error);
    return null;
  }
}

/**
 * Saves current game state to Supabase
 */
export async function saveGameStateToSupabase(walletAddress: string, gameState: any): Promise<boolean> {
  try {
    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.error('[Supabase Sync] Could not get user ID for wallet:', walletAddress);
      return false;
    }

    console.log('[Supabase Sync] Saving game state for user:', userId);

    // Save profile data if it exists
    if (gameState.userProfile) {
      await saveProfileToSupabase(walletAddress, {
        username: gameState.userProfile.username,
        avatarUrl: gameState.userProfile.avatarUrl,
        xHandle: gameState.userProfile.xHandle,
      });
    }

    // Update balances if provided
    if (gameState.userNilkBalance !== undefined || gameState.userRawNilkBalance !== undefined) {
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({
          nilk_balance: gameState.userNilkBalance,
          raw_nilk_balance: gameState.userRawNilkBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (balanceError) {
        console.error('[Supabase Sync] Error updating balances:', balanceError);
        return false;
      }
    }

    // Update machines if provided
    if (gameState.ownedMachines) {
      const { error: machineError } = await supabase
        .from('user_machines')
        .update({
          standard_machines: gameState.ownedMachines.standard,
          pro_machines: gameState.ownedMachines.pro,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (machineError) {
        console.error('[Supabase Sync] Error updating machines:', machineError);
        return false;
      }
    }

    // Update upgrades if provided
    if (gameState.yieldBoosterLevel !== undefined || 
        gameState.hasMoofiBadge !== undefined || 
        gameState.hasAlienFarmerBoost !== undefined) {
      const { error: upgradeError } = await supabase
        .from('user_upgrades')
        .update({
          yield_booster_level: gameState.yieldBoosterLevel,
          has_moofi_badge: gameState.hasMoofiBadge,
          has_alien_farmer_boost: gameState.hasAlienFarmerBoost,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (upgradeError) {
        console.error('[Supabase Sync] Error updating upgrades:', upgradeError);
        return false;
      }
    }

    // Sync cows if provided
    if (gameState.ownedCows) {
      await syncCowsToSupabase(userId, gameState.ownedCows);
    }

    console.log('[Supabase Sync] Auto-save successful');
    return true;

  } catch (error) {
    console.error('[Supabase Sync] Auto-save failed:', error);
    return false;
  }
}

/**
 * Syncs cow data to Supabase
 */
async function syncCowsToSupabase(userId: string, cows: Cow[]): Promise<void> {
  try {
    // Delete existing cows for this user
    const { error: deleteError } = await supabase
      .from('user_cows')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[Supabase Sync] Error deleting existing cows:', deleteError);
      return;
    }

    // Insert current cows
    if (cows.length > 0) {
      const cowData = cows.map(cow => ({
        id: cow.id,
        user_id: parseInt(userId),
        tier: cow.tier,
        level: cow.level,
        last_harvest_time: new Date(cow.lastHarvestTime).toISOString(),
        accumulated_raw_nilk: cow.accumulatedRawNilk || 0,
      }));

      const { error: insertError } = await supabase
        .from('user_cows')
        .insert(cowData);

      if (insertError) {
        console.error('[Supabase Sync] Error inserting cows:', insertError);
        return;
      }
    }

    console.log('[Supabase Sync] Cows synced successfully');
  } catch (error) {
    console.error('[Supabase Sync] Error syncing cows:', error);
  }
}

/**
 * Records a harvest action in the database
 */
export async function recordHarvestAction(
  walletAddress: string, 
  cowId: string, 
  rawNilkHarvested: number
): Promise<boolean> {
  try {
    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      console.error('[Supabase Sync] Could not get user ID for harvest record');
      return false;
    }

    const { error } = await supabase
      .from('harvest_history')
      .insert({
        user_id: parseInt(userId),
        cow_id: cowId,
        raw_nilk_harvested: rawNilkHarvested,
        harvested_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Supabase Sync] Error recording harvest action:', error);
      return false;
    }

    console.log('[Supabase Sync] Harvest action recorded successfully');
    return true;
  } catch (error) {
    console.error('[Supabase Sync] Error recording harvest action:', error);
    return false;
  }
}

/**
 * Gets user's harvest history
 */
export async function getUserHarvestHistory(walletAddress: string, limit: number = 50): Promise<any[]> {
  try {
    const userId = await getUserIdFromWallet(walletAddress);
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('harvest_history')
      .select('*')
      .eq('user_id', userId)
      .order('harvested_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase Sync] Error fetching harvest history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Supabase Sync] Error fetching harvest history:', error);
    return [];
  }
}

/**
 * Starts auto-save functionality
 */
export function startAutoSave(walletAddress: string, getGameState?: () => any): () => void {
  const interval = setInterval(async () => {
    if (getGameState) {
      const gameState = getGameState();
      await saveGameStateToSupabase(walletAddress, gameState);
    }
  }, 30000); // Save every 30 seconds

  console.log('[Supabase Sync] Auto-save started');

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log('[Supabase Sync] Auto-save stopped');
  };
} 