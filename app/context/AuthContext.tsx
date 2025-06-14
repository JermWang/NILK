'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { createOrUpdateUserProfile } from '@/app/store/supabase-sync';

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

  // Auto-sign in when wallet connects
  useEffect(() => {
    if (isConnected && address && !session && !isSigningIn.current) {
      signIn();
    } else if (!isConnected && session) {
      setSession(null);
    }
  }, [isConnected, address, session]);

  const signIn = async () => {
    if (!address || !chainId || isSigningIn.current) return;

    setLoading(true);
    isSigningIn.current = true;
    
    try {
      console.log('[Auth] Starting wallet-based sign-in for:', address);

      // Create SIWE message for verification
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to GOT NILK?',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: Math.random().toString(36).substring(2, 15), // Simple nonce
      });

      // Sign the message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // Verify the signature locally
      const { data: fields, error: validationError } = await message.verify({ signature });

      if (validationError) {
        console.error('[Auth] SIWE verification failed:', validationError);
        throw validationError;
      }

      if (fields.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature address does not match wallet address.");
      }

      // Create or update user profile in database
      const profile = await createOrUpdateUserProfile(address);
      
      if (!profile) {
        throw new Error("Failed to create/update user profile");
      }

      // Create session object
      const userSession = {
        user: {
          wallet_address: address
        }
      };

      setSession(userSession);
      console.log('[Auth] Sign-in successful for:', address);

    } catch (error) {
      console.error('[Auth] Sign-in failed:', error);
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
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signOut, loading }}>
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