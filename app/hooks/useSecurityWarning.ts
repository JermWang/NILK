'use client';

import { useState, useCallback } from 'react';

export function useSecurityWarning() {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);

  const checkSecurityWarning = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    
    const dismissed = localStorage.getItem('nilk-security-warning-dismissed');
    if (!dismissed) {
      setShowSecurityWarning(true);
      return false;
    }
    return true;
  }, []);

  const showWarning = useCallback(() => {
    setShowSecurityWarning(true);
  }, []);

  const hideWarning = useCallback(() => {
    setShowSecurityWarning(false);
  }, []);

  const dismissWarning = useCallback((dontShowAgain: boolean = false) => {
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('nilk-security-warning-dismissed', 'true');
    }
    setShowSecurityWarning(false);
  }, []);

  return {
    showSecurityWarning,
    checkSecurityWarning,
    showWarning,
    hideWarning,
    dismissWarning,
  };
} 