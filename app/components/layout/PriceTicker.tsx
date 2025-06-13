'use client';

import { useState, useEffect } from 'react';
import { getAllPrices } from '@/app/utils/priceService';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  displayName: string;
  icon?: string;
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const priceData = await getAllPrices();
        
        const tokenPrices: TokenPrice[] = [
          {
            symbol: 'HYPE',
            displayName: '$HYPE',
            price: priceData.hype?.price || 42,
            change24h: priceData.hype?.change24h || 0,
            icon: '/hyperliquid.png'
          },
          {
            symbol: 'SOL',
            displayName: '$SOL',
            price: priceData.sol?.price || 0,
            change24h: priceData.sol?.change24h || 0
          },
          {
            symbol: 'ETH',
            displayName: '$ETH',
            price: priceData.eth?.price || 0,
            change24h: priceData.eth?.change24h || 0
          },
          {
            symbol: 'BTC',
            displayName: '$BTC',
            price: priceData.btc?.price || 0,
            change24h: priceData.btc?.change24h || 0
          },
          {
            symbol: 'NILK',
            displayName: '$NILK',
            price: priceData.nilk?.price || 0.001,
            change24h: priceData.nilk?.change24h || 0,
            icon: '/nilk token.png'
          }
        ];

        setPrices(tokenPrices.filter(token => token.price > 0));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch prices:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchPrices();

    // Update every 30 seconds
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === 'NILK') {
      return price.toFixed(4); // Show more decimals for NILK
    }
    if (price < 1) {
      return price.toFixed(4);
    }
    if (price < 100) {
      return price.toFixed(2);
    }
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  const formatChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-1 bg-lime-400 rounded-full animate-pulse"></div>
          <span className="text-lime-400 text-xs font-mono">Loading prices...</span>
        </div>
      </div>
    );
  }

  // Create multiple copies to ensure smooth scrolling
  const renderPriceSet = (keyPrefix: string) => (
    prices.map((token, index) => (
      <div key={`${keyPrefix}-${token.symbol}`} className="flex items-center space-x-1 px-4">
        {/* Token icon if available */}
        {token.icon && (
          <img 
            src={token.icon} 
            alt={token.symbol}
            className="w-3 h-3 rounded-full"
          />
        )}
        
        {/* Token name */}
        <span className="text-lime-400 font-mono text-xs font-semibold">
          {token.displayName}
        </span>
        
        {/* Price */}
        <span className="text-white font-mono text-xs">
          ${formatPrice(token.price, token.symbol)}
        </span>
        
        {/* 24h change */}
        <div className={`flex items-center space-x-1 ${
          token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {token.change24h >= 0 ? (
            <TrendingUp className="w-2 h-2" />
          ) : (
            <TrendingDown className="w-2 h-2" />
          )}
          <span className="text-xs font-mono">
            {formatChange(token.change24h)}
          </span>
        </div>
        
        {/* Separator */}
        <div className="w-px h-2 bg-lime-400/20 mx-2"></div>
      </div>
    ))
  );

  return (
    <div className="w-full h-6 overflow-hidden relative">
      {/* Scrolling container with multiple copies for seamless loop */}
      <div className="flex animate-scroll whitespace-nowrap">
        {renderPriceSet('set1')}
        {renderPriceSet('set2')}
        {renderPriceSet('set3')}
        {renderPriceSet('set4')}
        {renderPriceSet('set5')}
        {renderPriceSet('set6')}
      </div>
      
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
    </div>
  );
} 