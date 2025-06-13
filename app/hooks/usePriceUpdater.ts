import { useEffect, useState } from 'react';
import { priceService, getHYPEPrice } from '@/app/utils/priceService';

interface PriceState {
  hyePrice: number;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

// Hook to manage HYPE price updates and calculate dynamic pricing
export const usePriceUpdater = () => {
  const [priceState, setPriceState] = useState<PriceState>({
    hyePrice: 42, // Fallback price
    lastUpdated: 0,
    isLoading: false,
    error: null
  });

  // Fetch price on mount and set up periodic updates
  useEffect(() => {
    const updatePrice = async () => {
      setPriceState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const price = await getHYPEPrice();
        setPriceState({
          hyePrice: price,
          lastUpdated: Date.now(),
          isLoading: false,
          error: null
        });
      } catch (error) {
        setPriceState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch price'
        }));
      }
    };

    // Initial fetch
    updatePrice();

    // Set up interval for periodic updates (every 5 minutes)
    const interval = setInterval(updatePrice, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate HYPE equivalent for NILK amounts
  const calculateHYPEEquivalent = (nilkAmount: number, estimatedNilkUSD: number = 0.001) => {
    const nilkUSDValue = nilkAmount * estimatedNilkUSD;
    return Number((nilkUSDValue / priceState.hyePrice).toFixed(3));
  };

  // Calculate USD value of HYPE amount
  const calculateHYPEUSDValue = (hypeAmount: number) => {
    return Number((hypeAmount * priceState.hyePrice).toFixed(2));
  };

  // Get dynamic pricing for market items
  const getDynamicHYPEPricing = () => {
    return {
      // Cows
      commonCow: calculateHYPEEquivalent(65000),
      cosmicCow: calculateHYPEEquivalent(275000),
      galacticCow: calculateHYPEEquivalent(750000),
      
      // Machines  
      standardMachine: calculateHYPEEquivalent(150000),
      proMachine: calculateHYPEEquivalent(375000),
      
      // Special items
      hypeProcessingBoost: calculateHYPEEquivalent(5000), // ~$5 worth
      premiumLPBoost: calculateHYPEEquivalent(210000), // ~$210 worth
      
      // Achievement rewards (in USD equivalent)
      dailyProcessingReward: calculateHYPEEquivalent(2000), // ~$2 worth
      fusionMilestone: calculateHYPEEquivalent(10000), // ~$10 worth
      liquidityMilestone: calculateHYPEEquivalent(20000), // ~$20 worth
    };
  };

  // Manual refresh function
  const refreshPrice = async () => {
    setPriceState(prev => ({ ...prev, isLoading: true }));
    try {
      const price = await priceService.refreshPrice();
      setPriceState({
        hyePrice: price,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setPriceState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh price'
      }));
    }
  };

  return {
    ...priceState,
    calculateHYPEEquivalent,
    calculateHYPEUSDValue,
    getDynamicHYPEPricing,
    refreshPrice,
    cacheStatus: priceService.getCacheStatus()
  };
};

// Utility hook for components that just need the current HYPE price
export const useHYPEPrice = () => {
  const { hyePrice, isLoading, error } = usePriceUpdater();
  return { hyePrice, isLoading, error };
};

export default usePriceUpdater; 