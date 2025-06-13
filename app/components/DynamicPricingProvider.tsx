'use client';

import React, { useEffect } from 'react';
import useGameStore from '@/app/store/useGameStore';
import { getHYPEPrice } from '@/app/utils/priceService';

interface DynamicPricingProviderProps {
  children: React.ReactNode;
}

export const DynamicPricingProvider: React.FC<DynamicPricingProviderProps> = ({ children }) => {
  const updateHYPEPrice = useGameStore((state) => state.actions.updateHYPEPrice);
  const updateNilkUSDEstimate = useGameStore((state) => state.actions.updateNilkUSDEstimate);

  useEffect(() => {
    // Function to update HYPE price
    const updatePrice = async () => {
      try {
        const price = await getHYPEPrice();
        updateHYPEPrice(price);
        console.log(`[DynamicPricing] HYPE price updated to $${price}`);
      } catch (error) {
        console.error('[DynamicPricing] Failed to update HYPE price:', error);
      }
    };

    // Function to estimate NILK USD value based on market conditions
    const updateNilkEstimate = () => {
      // This could be enhanced with actual market data or user input
      // For now, we'll use a conservative estimate based on potential market caps
      const estimatedMarketCap = 1000000; // $1M market cap assumption
      const totalSupply = 1000000000; // 1B tokens
      const estimatedNilkUSD = estimatedMarketCap / totalSupply;
      
      updateNilkUSDEstimate(estimatedNilkUSD);
      console.log(`[DynamicPricing] NILK USD estimate updated to $${estimatedNilkUSD.toFixed(6)}`);
    };

    // Initial updates
    updatePrice();
    updateNilkEstimate();

    // Set up intervals
    const priceInterval = setInterval(updatePrice, 5 * 60 * 1000); // Every 5 minutes
    const nilkInterval = setInterval(updateNilkEstimate, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(priceInterval);
      clearInterval(nilkInterval);
    };
  }, [updateHYPEPrice, updateNilkUSDEstimate]);

  return <>{children}</>;
};

export default DynamicPricingProvider; 