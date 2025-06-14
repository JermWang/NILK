'use client';

import { ReactNode } from 'react';
import { useSecurityWarning } from '@/app/hooks/useSecurityWarning';
import SecurityWarningModal from './SecurityWarningModal';

interface SecureWalletActionProps {
  children: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  className?: string;
}

export default function SecureWalletAction({ 
  children, 
  onAction, 
  disabled = false,
  className = '' 
}: SecureWalletActionProps) {
  const { 
    showSecurityWarning, 
    checkSecurityWarning, 
    hideWarning 
  } = useSecurityWarning();

  const handleClick = () => {
    if (disabled) return;
    
    if (checkSecurityWarning()) {
      // User has already dismissed warning, proceed with action
      onAction();
    }
    // If warning needs to be shown, it's already triggered by checkSecurityWarning
  };

  const handleSecurityProceed = () => {
    hideWarning();
    onAction();
  };

  const handleSecurityClose = () => {
    hideWarning();
  };

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      
      <SecurityWarningModal
        isOpen={showSecurityWarning}
        onClose={handleSecurityClose}
        onProceed={handleSecurityProceed}
      />
    </>
  );
} 