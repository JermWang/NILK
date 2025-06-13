import React from 'react';
import { RefreshCw, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePriceUpdater } from '@/app/hooks/usePriceUpdater';
import Image from 'next/image';

interface HYPEPriceDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export const HYPEPriceDisplay: React.FC<HYPEPriceDisplayProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { 
    hyePrice, 
    lastUpdated, 
    isLoading, 
    error, 
    refreshPrice, 
    cacheStatus 
  } = usePriceUpdater();

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-3 border border-purple-400/40 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 relative">
            <Image 
              src="/hyperliquid.png" 
              alt="HYPE Token" 
              fill 
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-purple-300 text-sm font-medium">HYPE</span>
              {error && (
                <AlertCircle className="w-4 h-4 text-red-400" title={error} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-100 font-bold text-lg">
                ${hyePrice.toFixed(2)}
              </span>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={refreshPrice}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="text-purple-300 hover:text-purple-100 hover:bg-purple-800/50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-purple-400/20">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1 text-purple-300">
              <Clock className="w-3 h-3" />
              <span>Updated: {formatTimeAgo(lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-1 text-purple-300">
              <TrendingUp className="w-3 h-3" />
              <span>Source: {cacheStatus.source || 'Loading...'}</span>
            </div>
          </div>
          
          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HYPEPriceDisplay; 