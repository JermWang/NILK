"use client";

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import useGameStore from '@/app/store/useGameStore';
import { fetchInitialGameState } from '@/app/store/supabase-sync';

export default function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { syncStateFromSupabase, startAutoSave, stopAutoSave, startRealTimeAccumulation, stopRealTimeAccumulation, updateProfile, setProfileComplete } = useGameStore((state) => state.actions);

  useEffect(() => {
    const handleWalletConnection = async () => {
      if (session?.user?.wallet_address) {
        const walletAddress = session.user.wallet_address;
        console.log('[GameStateProvider] Wallet connected, setting up user profile...');

        try {
          // Fetch initial game state from database
          const initialState = await fetchInitialGameState(walletAddress);
          if (initialState) {
            syncStateFromSupabase(initialState);
            console.log('[GameStateProvider] Game state synced successfully');

            // Sync profile data if available
            if (initialState.userProfile) {
              updateProfile({
                username: initialState.userProfile.username,
                avatarUrl: initialState.userProfile.avatarUrl,
                xHandle: initialState.userProfile.xHandle,
              });
              setProfileComplete(initialState.userProfile.isProfileComplete);
            }

            // Start auto-save (every 30 seconds)
            startAutoSave(walletAddress);
            console.log('[GameStateProvider] Auto-save started');

            // Start real-time accumulation (every 5 seconds)
            startRealTimeAccumulation();
            console.log('[GameStateProvider] Real-time accumulation started');

          } else {
            console.log('[GameStateProvider] No initial state found, using default state.');
          }

        } catch (error) {
          console.error('[GameStateProvider] Failed to setup user profile:', error);
        }
      } else {
        // Wallet disconnected - cleanup
        stopAutoSave();
        stopRealTimeAccumulation();
        console.log('[GameStateProvider] Wallet disconnected, stopped real-time features.');
      }
    };

    handleWalletConnection();

    // Cleanup on unmount
    return () => {
      stopAutoSave();
      stopRealTimeAccumulation();
    };
  }, [session, syncStateFromSupabase, startAutoSave, stopAutoSave, startRealTimeAccumulation, stopRealTimeAccumulation, updateProfile, setProfileComplete]);

  return <>{children}</>;
}

// Also export as named export for compatibility
export { GameStateProvider }; 