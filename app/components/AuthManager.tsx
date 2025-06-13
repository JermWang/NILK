'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useAccount } from 'wagmi';

const AuthManager = () => {
  const { signIn, session, loading } = useAuth();
  const { isConnected, isConnecting, address } = useAccount();
  const [hasAttemptedSignIn, setHasAttemptedSignIn] = useState(false);
  const [lastAddress, setLastAddress] = useState<string | undefined>();

  useEffect(() => {
    // Reset sign-in attempt when address changes
    if (address !== lastAddress) {
      setHasAttemptedSignIn(false);
      setLastAddress(address);
    }
  }, [address, lastAddress]);

  useEffect(() => {
    // Only attempt automatic sign-in once per wallet connection
    if (
      isConnected && 
      !session && 
      !loading && 
      !isConnecting && 
      !hasAttemptedSignIn &&
      address
    ) {
      setHasAttemptedSignIn(true);
      signIn().catch((error) => {
        console.log('Auto sign-in failed:', error);
        // Don't retry automatically - user can manually sign in
      });
    }
  }, [isConnected, session, loading, isConnecting, signIn, hasAttemptedSignIn, address]);

  return null;
};

export default AuthManager; 