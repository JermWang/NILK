'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from 'wagmi';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WalletConnection() {
  const { isConnected } = useAccount();
  const { session, signIn, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return only the ConnectButton during SSR to prevent hydration mismatch
    return (
      <div className="flex items-center space-x-2">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <ConnectButton />
      
      {/* Show manual sign-in button when wallet is connected but not authenticated */}
      {isConnected && !session && !loading && (
        <Button
          onClick={signIn}
          variant="outline"
          size="sm"
          className="border-lime-500/50 text-lime-300 hover:bg-lime-900/30 flex items-center space-x-2"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Button>
      )}
      
      {/* Show loading state when signing in */}
      {isConnected && !session && loading && (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="border-lime-500/50 text-lime-300 flex items-center space-x-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing In...</span>
        </Button>
      )}
    </div>
  );
} 