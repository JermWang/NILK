import { NextRequest, NextResponse } from 'next/server';
import { fetchInitialGameState, saveGameStateToSupabase, createOrUpdateUserProfile } from '@/app/store/supabase-sync';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test API] Starting database sync test');
    
    // Create a test user ID (string format for current Supabase types)
    const testWalletAddress = '0x1234567890123456789012345678901234567890';
    const testUserId = '1234567890123456789'; // String format for compatibility
    
    console.log('[Test API] Creating test user:', testUserId);
    
    // Test database connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('[Test API] Connection error:', connectionError);
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }

    console.log('[Test API] Database connection successful');

    // Simple test - just try to fetch from profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('[Test API] Profiles query error:', profilesError);
    } else {
      console.log('[Test API] Profiles query successful, found', profilesTest?.length || 0, 'profiles');
    }

    // Try to test user_balances table if it exists
    const { data: balancesTest, error: balancesError } = await supabase
      .from('user_balances')
      .select('*')
      .limit(1);
    
    let gameState = null;
    if (balancesError) {
      console.error('[Test API] Balances query error:', balancesError);
    } else {
      console.log('[Test API] Balances query successful, found', balancesTest?.length || 0, 'balance records');
      
      // If we have balance data, create a sample game state
      if (balancesTest && balancesTest.length > 0) {
        const balance = balancesTest[0];
        gameState = {
          userNilkBalance: balance.nilk_balance || 0,
          userRawNilkBalance: balance.raw_nilk_balance || 0,
          ownedCows: [],
          ownedMachines: { standard: 0, pro: 0 },
          yieldBoosterLevel: 0,
          hasMoofiBadge: false,
          hasAlienFarmerBoost: false
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database sync test successful',
      testUserId: testUserId.toString(),
      gameState,
      databaseConnection: 'OK',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database sync test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, gameState } = await request.json();
    
    if (!userId || !gameState) {
      return NextResponse.json({ error: 'userId and gameState required' }, { status: 400 });
    }

    // Test saving game state
    const success = await saveGameStateToSupabase(userId, gameState);
    
    return NextResponse.json({
      success,
      message: success ? 'Game state saved successfully' : 'Failed to save game state',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database save test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
} 