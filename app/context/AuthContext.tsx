'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { supabase } from '@/lib/supabaseClient';
import useGameStore, { useGameActions, initialMarketItems } from '@/app/store/useGameStore';

interface AuthContextType {
  session: { user: { wallet_address: string } } | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<{ user: { wallet_address: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const isSigningIn = useRef(false);
  
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { syncStateFromSupabase } = useGameActions();

  // Auto-sign in when wallet connects
  useEffect(() => {
    if (isConnected && address && !session && !isSigningIn.current) {
      handleSignIn();
    } else if (!isConnected && session) {
      setSession(null);
    }
  }, [isConnected, address, session]);

  const handleSignIn = async () => {
    if (!address || !chainId || isSigningIn.current) return;

    setLoading(true);
    isSigningIn.current = true;
    
    try {
      console.log('[Auth] Starting sign-in for:', address);

      // 1. Get nonce from Supabase
      const { data: nonceData, error: nonceError } = await supabase.functions.invoke('siwe-nonce');
      if (nonceError || !nonceData) throw new Error('Failed to get nonce.');

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: nonceData.nonce,
      });

      // 3. Sign the message
      const signature = await signMessageAsync({ message: message.prepareMessage() });

      // 4. Call the login-event function which handles SIWE verification and profile update
      const { data: profileData, error: loginError } = await supabase.functions.invoke('login-event', {
        body: {
          message: message.prepareMessage(),
          signature,
          walletAddress: address,
        },
      });

      if (loginError) {
        console.error('[Auth] Login function failed:', loginError);
        throw new Error(loginError.message);
      }
      
      if (!profileData) {
        throw new Error("Login function did not return a profile.");
      }

      // 5. Sync the returned profile with the Zustand store
      syncStateFromSupabase(profileData);

      // 6. Create local session object
      const userSession = {
        user: {
          id: profileData.id,
          wallet_address: address
        }
      };
      setSession(userSession);

      console.log('[Auth] Sign-in successful for:', address);

    } catch (error) {
      console.error('[Auth] Sign-in process failed:', error);
      // Ensure user is fully logged out on failure
      disconnect();
      setSession(null);
    } finally {
      setLoading(false);
      isSigningIn.current = false;
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    disconnect();
    setSession(null);
    // Manually reset the Zustand store to its initial state
    useGameStore.setState({
        userNilkBalance: 0,
        userRawNilkBalance: 50,
        userHypeBalance: 0,
        ownedMachines: { standard: 0, pro: 0 },
        ownedCows: [],
        yieldBoosterLevel: 0,
        nextCowId: 1,
        lastGlobalHarvestTime: Date.now(),
        hasMoofiBadge: false,
        hasAlienFarmerBoost: false,
        hasFlaskBlueprint: false,
        activeFlask: null,
        flaskInventory: [],
        marketItems: initialMarketItems,
        userProfile: {
          username: null,
          avatarUrl: null,
          xHandle: null,
          isProfileComplete: false,
        },
        // Reset other parts of the state as well
        treasuryBalance: 100000000,
        treasuryHypeBalance: 500000,
        dynamicPricing: {
            hyePrice: 42,
            lastPriceUpdate: 0,
            estimatedNilkUSD: 0,
        },
        liquidityPools: {
            nilkHype: {
                userLpTokens: 0,
                totalLpTokens: 0,
                nilkReserve: 0,
                hypeReserve: 0,
                rewardsAccumulated: 0,
                lastRewardTime: 0,
                tradingFeeRate: 0.3,
                totalFeesCollected: 0,
            },
        },
        hypeRewards: {
            dailyProcessingBonus: 0,
            fusionMilestones: 0,
            liquidityMilestones: 0,
            lastDailyRewardClaim: 0,
        },
    });
    console.log('[Auth] Zustand store has been reset.');
  };

  return (
    <AuthContext.Provider value={{ session, signIn: handleSignIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 