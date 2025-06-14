'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from 'wagmi';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, Wallet } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import SecurityWarningModal from './SecurityWarningModal';

export default function WalletConnection() {
  const { isConnected } = useAccount();
  const { session, signIn, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(false);
  const openConnectModalRef = useRef<(() => void) | null>(null);

  // Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has dismissed the security warning before
  const checkSecurityWarning = () => {
    const dismissed = localStorage.getItem('nilk-security-warning-dismissed');
    if (!dismissed) {
      setShowSecurityWarning(true);
      return false;
    }
    return true;
  };

  const handleConnectClick = () => {
    if (checkSecurityWarning()) {
      // User has already dismissed warning, proceed normally
      return;
    }
    // Warning will be shown, set pending connection
    setPendingConnection(true);
  };

  const handleSecurityProceed = () => {
    setPendingConnection(false);
    // Trigger the connect modal after security approval
    if (openConnectModalRef.current) {
      openConnectModalRef.current();
    }
  };

  const handleSecurityClose = () => {
    setShowSecurityWarning(false);
    setPendingConnection(false);
  };

  if (!mounted) {
    // Return only the ConnectButton during SSR to prevent hydration mismatch
    return (
      <div className="flex items-center space-x-2">
        <ConnectButton />
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center space-x-2">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            // Store the openConnectModal function in the ref
            openConnectModalRef.current = openConnectModal;
            
            // The mounted check is important for hydration
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        onClick={() => {
                          if (checkSecurityWarning()) {
                            openConnectModal();
                          }
                        }}
                        disabled={pendingConnection}
                        className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button onClick={openChainModal} variant="destructive">
                        Wrong network
                      </Button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={openChainModal}
                        variant="outline"
                        size="sm"
                        className="border-lime-500/50 text-lime-300 hover:bg-lime-900/30"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 12, height: 12 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </Button>

                      <Button
                        onClick={openAccountModal}
                        variant="outline"
                        size="sm"
                        className="border-lime-500/50 text-lime-300 hover:bg-lime-900/30"
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      
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

      {/* Security Warning Modal */}
      <SecurityWarningModal
        isOpen={showSecurityWarning}
        onClose={handleSecurityClose}
        onProceed={handleSecurityProceed}
      />
    </>
  );
} 