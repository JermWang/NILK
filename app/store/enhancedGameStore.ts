import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Enhanced reward calculation with dynamic scaling
export const calculateEnhancedLPRewards = (
  userLpTokens: number,
  totalLpTokens: number,
  nilkReserve: number,
  lastRewardTime: number
): number => {
  if (userLpTokens === 0) return 0;
  
  const hoursElapsed = (Date.now() - lastRewardTime) / (1000 * 60 * 60);
  const userPoolShare = userLpTokens / totalLpTokens;
  
  // Dynamic APR: Higher rewards for smaller pools
  const poolSizeMultiplier = Math.max(1, 100000 / totalLpTokens);
  const baseAPR = Math.min(0.5, 0.25 * poolSizeMultiplier); // 25-50% APR
  const baseRewardRate = baseAPR / (365 * 24); // Convert to hourly rate
  
  // Early adopter bonus (first 30 days)
  const poolAge = hoursElapsed / 24;
  const earlyAdopterBonus = poolAge < 30 ? 1.5 : 1.0;
  
  const newRewards = userPoolShare * nilkReserve * baseRewardRate * hoursElapsed * earlyAdopterBonus;
  
  return newRewards;
};

// Trading fee calculation
export const calculateTradingFee = (amount: number, feeRate: number = 0.003): number => {
  return amount * feeRate;
};

// HYPE reward calculation based on achievements
export const calculateHypeRewards = (
  processingStreak: number,
  fusionCount: number,
  lpMilestones: number
): number => {
  let totalHype = 0;
  
  // Daily processing bonus (1-3 HYPE based on streak)
  if (processingStreak > 0) {
    totalHype += Math.min(3, 1 + Math.floor(processingStreak / 7)); // 1-3 HYPE
  }
  
  // Fusion milestones (5 HYPE per fusion)
  totalHype += fusionCount * 5;
  
  // LP milestones (10 HYPE per milestone)
  totalHype += lpMilestones * 10;
  
  return totalHype;
};

// Enhanced marketplace item with HYPE support
export interface EnhancedUpgradeItem {
  id: string;
  name: string;
  description: string;
  image: string;
  pricing: {
    nilk?: number;
    rawNilk?: number;
    hype?: number;
    alternatives?: Array<{
      currency: 'NILK' | 'HYPE';
      amount: number;
    }>;
  };
  category: 'cows' | 'machines' | 'flasks' | 'boosters';
  stats: Record<string, any>;
  isUniquePurchase?: boolean;
  tier?: string;
}

// Enhanced game state with HYPE integration
export interface EnhancedGameState {
  // Existing balances
  userNilkBalance: number;
  userRawNilkBalance: number;
  userHypeBalance: number;
  
  // Treasury management
  treasuryNilkBalance: number;
  treasuryHypeBalance: number;
  
  // Enhanced liquidity pool
  liquidityPool: {
    userLpTokens: number;
    totalLpTokens: number;
    nilkReserve: number;
    hypeReserve: number;
    lastRewardTime: number;
    tradingFeeRate: number;
    totalFeesCollected: number;
    rewardsAccumulated: number;
  };
  
  // Achievement tracking for HYPE rewards
  achievements: {
    processingStreak: number;
    fusionCount: number;
    lpMilestones: number;
    lastDailyRewardClaim: number;
    totalHypeEarned: number;
  };
  
  // Enhanced marketplace
  enhancedMarketItems: EnhancedUpgradeItem[];
}

// Enhanced actions
export interface EnhancedGameActions {
  // LP actions with enhanced rewards
  addLiquidityEnhanced: (nilkAmount: number, hypeAmount: number) => boolean;
  removeLiquidityEnhanced: (lpTokenAmount: number) => boolean;
  claimEnhancedRewards: () => number;
  calculateCurrentRewards: () => number;
  
  // HYPE management
  earnHypeFromAchievement: (type: 'processing' | 'fusion' | 'lp', amount: number) => void;
  purchaseWithHype: (itemId: string, hypeAmount: number) => boolean;
  
  // Trading with fees
  swapWithFees: (fromToken: 'NILK' | 'HYPE', toToken: 'NILK' | 'HYPE', amount: number) => boolean;
  
  // Treasury management
  updateTreasuryFromFees: (nilkFees: number, hypeFees: number) => void;
  
  // Enhanced marketplace
  purchaseEnhancedItem: (itemId: string, currency: 'NILK' | 'HYPE' | 'RAW_NILK') => boolean;
}

// Create the enhanced store
interface EnhancedGameStore extends EnhancedGameState {
  actions: EnhancedGameActions;
}

export const useEnhancedGameStore = create<EnhancedGameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userNilkBalance: 50000,
      userRawNilkBalance: 5000,
      userHypeBalance: 100,
      treasuryNilkBalance: 1000000,
      treasuryHypeBalance: 10000,
      
      liquidityPool: {
        userLpTokens: 0,
        totalLpTokens: 1000000,
        nilkReserve: 500000,
        hypeReserve: 1000,
        lastRewardTime: Date.now(),
        tradingFeeRate: 0.003,
        totalFeesCollected: 0,
        rewardsAccumulated: 0,
      },
      
      achievements: {
        processingStreak: 0,
        fusionCount: 0,
        lpMilestones: 0,
        lastDailyRewardClaim: 0,
        totalHypeEarned: 0,
      },
      
      enhancedMarketItems: [
        {
          id: 'common_cow_multi',
          name: 'Common Cow',
          description: 'A reliable Nilk producer. 25% discount with HYPE!',
          image: '/NILK COW.png',
          pricing: {
            nilk: 65000,   // 5x INCREASED for whale protection (1B supply)
            hype: 1.5      // 25% discount: 2 * 0.75 = 1.5 HYPE ($63 USD)
          },
          category: 'cows',
          stats: { 'Base Production': '5,000 Raw Nilk/Day', 'HYPE Discount': '25% Off' },
          tier: 'common'
        },
        {
          id: 'cosmic_cow_multi',
          name: 'Cosmic Cow',
          description: 'Premium cow with stellar production. 25% discount with HYPE!',
          image: '/cosmic cow.png',
          pricing: {
            nilk: 275000,  // 5x INCREASED for whale protection (1B supply)
            hype: 5.25     // 25% discount: 7 * 0.75 = 5.25 HYPE ($220 USD)
          },
          category: 'cows',
          stats: { 'Base Production': '15,000 Raw Nilk/Day', 'HYPE Discount': '25% Off' },
          tier: 'cosmic'
        },
        {
          id: 'standard_machine_multi',
          name: 'Standard Machine',
          description: 'Efficient processing machine. 25% discount with HYPE!',
          image: '/nilk machine.png',
          pricing: {
            nilk: 150000,  // 5x INCREASED for whale protection (1B supply)
            hype: 3        // 25% discount: 4 * 0.75 = 3 HYPE ($126 USD)
          },
          category: 'machines',
          stats: { 'Efficiency': '65%', 'HYPE Discount': '25% Off' },
          isUniquePurchase: false
        },
        {
          id: 'pro_machine_multi',
          name: 'PRO Machine',
          description: 'Premium processing machine. 25% discount with HYPE!',
          image: '/nilk machine PRO.png',
          pricing: {
            nilk: 375000,  // 5x INCREASED for whale protection (1B supply)
            hype: 6.75     // 25% discount: 9 * 0.75 = 6.75 HYPE ($284 USD)
          },
          category: 'machines',
          stats: { 'Efficiency': '85%', 'HYPE Discount': '25% Off' },
          isUniquePurchase: false
        }
      ],
      
      actions: {
        addLiquidityEnhanced: (nilkAmount: number, hypeAmount: number) => {
          const state = get();
          const pool = state.liquidityPool;
          
          if (state.userNilkBalance < nilkAmount || state.userHypeBalance < hypeAmount) {
            return false;
          }
          
          // Calculate LP tokens with enhanced formula
          let lpTokensToMint: number;
          if (pool.totalLpTokens === 0) {
            lpTokensToMint = Math.sqrt(nilkAmount * hypeAmount);
          } else {
            const nilkShare = nilkAmount / pool.nilkReserve;
            const hypeShare = hypeAmount / pool.hypeReserve;
            const minShare = Math.min(nilkShare, hypeShare);
            lpTokensToMint = minShare * pool.totalLpTokens;
          }
          
          set(state => ({
            userNilkBalance: state.userNilkBalance - nilkAmount,
            userHypeBalance: state.userHypeBalance - hypeAmount,
            liquidityPool: {
              ...state.liquidityPool,
              userLpTokens: state.liquidityPool.userLpTokens + lpTokensToMint,
              totalLpTokens: state.liquidityPool.totalLpTokens + lpTokensToMint,
              nilkReserve: state.liquidityPool.nilkReserve + nilkAmount,
              hypeReserve: state.liquidityPool.hypeReserve + hypeAmount,
            }
          }));
          
          return true;
        },
        
        removeLiquidityEnhanced: (lpTokenAmount: number) => {
          const state = get();
          const pool = state.liquidityPool;
          
          if (pool.userLpTokens < lpTokenAmount) return false;
          
          const share = lpTokenAmount / pool.totalLpTokens;
          const nilkToWithdraw = share * pool.nilkReserve;
          const hypeToWithdraw = share * pool.hypeReserve;
          
          // Claim rewards first
          get().actions.claimEnhancedRewards();
          
          set(state => ({
            userNilkBalance: state.userNilkBalance + nilkToWithdraw,
            userHypeBalance: state.userHypeBalance + hypeToWithdraw,
            liquidityPool: {
              ...state.liquidityPool,
              userLpTokens: state.liquidityPool.userLpTokens - lpTokenAmount,
              totalLpTokens: state.liquidityPool.totalLpTokens - lpTokenAmount,
              nilkReserve: state.liquidityPool.nilkReserve - nilkToWithdraw,
              hypeReserve: state.liquidityPool.hypeReserve - hypeToWithdraw,
            }
          }));
          
          return true;
        },
        
        calculateCurrentRewards: () => {
          const state = get();
          const pool = state.liquidityPool;
          
          return calculateEnhancedLPRewards(
            pool.userLpTokens,
            pool.totalLpTokens,
            pool.nilkReserve,
            pool.lastRewardTime
          );
        },
        
        claimEnhancedRewards: () => {
          const rewards = get().actions.calculateCurrentRewards();
          
          if (rewards > 0) {
            set(state => ({
              userNilkBalance: state.userNilkBalance + rewards,
              liquidityPool: {
                ...state.liquidityPool,
                lastRewardTime: Date.now(),
                rewardsAccumulated: 0,
              }
            }));
          }
          
          return rewards;
        },
        
        earnHypeFromAchievement: (type: 'processing' | 'fusion' | 'lp', amount: number) => {
          // No longer awarding HYPE - keeping function for compatibility
          console.log(`Achievement completed: ${type}, but no HYPE rewards given`);
        },
        
        purchaseWithHype: (itemId: string, hypeAmount: number) => {
          const state = get();
          
          if (state.userHypeBalance < hypeAmount) return false;
          
          set(prevState => ({
            userHypeBalance: prevState.userHypeBalance - hypeAmount,
            treasuryHypeBalance: prevState.treasuryHypeBalance + hypeAmount,
          }));
          
          return true;
        },
        
        swapWithFees: (fromToken: 'NILK' | 'HYPE', toToken: 'NILK' | 'HYPE', amount: number) => {
          const state = get();
          const pool = state.liquidityPool;
          const fee = calculateTradingFee(amount, pool.tradingFeeRate);
          const amountAfterFee = amount - fee;
          
          // Simple swap calculation (would be more complex in real AMM)
          const ratio = pool.nilkReserve / pool.hypeReserve;
          let outputAmount: number;
          
          if (fromToken === 'NILK' && toToken === 'HYPE') {
            outputAmount = amountAfterFee / ratio;
            if (state.userNilkBalance < amount) return false;
            
            set(prevState => ({
              userNilkBalance: prevState.userNilkBalance - amount,
              userHypeBalance: prevState.userHypeBalance + outputAmount,
              liquidityPool: {
                ...prevState.liquidityPool,
                nilkReserve: prevState.liquidityPool.nilkReserve + amountAfterFee,
                hypeReserve: prevState.liquidityPool.hypeReserve - outputAmount,
                totalFeesCollected: prevState.liquidityPool.totalFeesCollected + fee,
              }
            }));
          } else if (fromToken === 'HYPE' && toToken === 'NILK') {
            outputAmount = amountAfterFee * ratio;
            if (state.userHypeBalance < amount) return false;
            
            set(prevState => ({
              userHypeBalance: prevState.userHypeBalance - amount,
              userNilkBalance: prevState.userNilkBalance + outputAmount,
              liquidityPool: {
                ...prevState.liquidityPool,
                hypeReserve: prevState.liquidityPool.hypeReserve + amountAfterFee,
                nilkReserve: prevState.liquidityPool.nilkReserve - outputAmount,
                totalFeesCollected: prevState.liquidityPool.totalFeesCollected + fee,
              }
            }));
          }
          
          return true;
        },
        
        updateTreasuryFromFees: (nilkFees: number, hypeFees: number) => {
          set(state => ({
            treasuryNilkBalance: state.treasuryNilkBalance + nilkFees,
            treasuryHypeBalance: state.treasuryHypeBalance + hypeFees,
          }));
        },
        
        purchaseEnhancedItem: (itemId: string, currency: 'NILK' | 'HYPE' | 'RAW_NILK') => {
          const state = get();
          const item = state.enhancedMarketItems.find(i => i.id === itemId);
          
          if (!item) return false;
          
          let cost = 0;
          let hasEnoughBalance = false;
          
          if (currency === 'NILK' && item.pricing.nilk) {
            cost = item.pricing.nilk;
            hasEnoughBalance = state.userNilkBalance >= cost;
          } else if (currency === 'HYPE' && item.pricing.hype) {
            cost = item.pricing.hype;
            hasEnoughBalance = state.userHypeBalance >= cost;
          } else if (currency === 'RAW_NILK' && item.pricing.rawNilk) {
            cost = item.pricing.rawNilk;
            hasEnoughBalance = state.userRawNilkBalance >= cost;
          }
          
          if (!hasEnoughBalance) return false;
          
          // Deduct payment
          if (currency === 'NILK') {
            set(prevState => ({ userNilkBalance: prevState.userNilkBalance - cost }));
          } else if (currency === 'HYPE') {
            set(prevState => ({ userHypeBalance: prevState.userHypeBalance - cost }));
          } else if (currency === 'RAW_NILK') {
            set(prevState => ({ userRawNilkBalance: prevState.userRawNilkBalance - cost }));
          }
          
          return true;
        },
      },
    }),
    {
      name: 'enhanced-nilk-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['actions'].includes(key))
        ),
    }
  )
);

export default useEnhancedGameStore; 