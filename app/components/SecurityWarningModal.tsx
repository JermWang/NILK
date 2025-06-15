'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export default function SecurityWarningModal({ 
  isOpen, 
  onClose, 
  onProceed 
}: SecurityWarningModalProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Reset acknowledgment when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAcknowledged(false);
    }
  }, [isOpen]);

  const handleProceed = () => {
    if (dontShowAgain) {
      localStorage.setItem('nilk-security-warning-dismissed', 'true');
    }
    onProceed();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Shield className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-orange-300 flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Reminder
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-left mt-4">
            We care about your safety! Before connecting your wallet:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-500/30 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-200">
              <strong>Always use a burner wallet</strong> when connecting to third-party sites, 
              including NILK. Never connect wallets containing significant funds.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Create a separate wallet with minimal funds for gaming</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Only transfer what you&apos;re willing to risk</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Keep your main wallet secure and disconnected</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="acknowledge"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="acknowledge" className="text-sm text-slate-300 cursor-pointer">
              I understand and am using a burner wallet
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dontShow"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="dontShow" className="text-sm text-slate-400 cursor-pointer">
              Don&apos;t show this warning again
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={!hasAcknowledged}
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed Safely
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 