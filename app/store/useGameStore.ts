"use client"
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';
import { achievementManager } from './achievementSystem';

export interface Machine {
  id: MachineType;
  name: string;
  conversionRate: number;
  feePercentage: number;
  costNilk: number;
  costHype?: number; // Optional alternative currency
  costUsdc?: number; // Optional alternative currency
  imageUrl?: string; // For displaying in UI
  description: string;
  fusionCostNilk?: number; // Added for Pro Machine
}

export type MachineType = 'manual' | 'standard' | 'pro';

export const MACHINES: Record<Exclude<MachineType, 'manual'>, Machine> = {
  standard: {
    id: 'standard',
    name: 'Standard Nilk Machine',
    conversionRate: 0.35, // Beta: 0.35
    feePercentage: 8,    // Beta: 8
    costNilk: 150000,    // 5x INCREASED for whale protection (1B supply)
    costHype: 4,         // $168 USD at $42/HYPE - realistic pricing
    costUsdc: 5,
    imageUrl: '/nilk machine.png',
    description: 'A reliable machine for converting Raw Nilk to $NILK.'
  },
  pro: {
    id: 'pro',
    name: 'Pro Nilk Machine',
    conversionRate: 0.45, // Beta: 0.45
    feePercentage: 4,    // Beta: 4
    costNilk: 375000,    // 5x INCREASED for whale protection (1B supply)
    fusionCostNilk: 5000, // Beta: 5000 (Pro Machine Fusion Fee)
    costHype: 9,         // $378 USD at $42/HYPE - realistic pricing
    costUsdc: 20,
    imageUrl: '/nilk machine PRO.png',
    description: 'Top-tier efficiency and lower fees for serious Nilk producers.'
  }
};

export const MANUAL_PROCESSING_STATS: Omit<Machine, 'id' | 'name' | 'costNilk' | 'costHype' | 'costUsdc' | 'imageUrl' | 'description' | 'fusionCostNilk'> & { name: string, description: string, id: 'manual', imageUrl: string } = {
  id: 'manual',
  name: 'Manual Processing',
  conversionRate: 0.25, // Beta: 0.25
  feePercentage: 12,   // Beta: 12
  description: 'Basic, less efficient processing without a machine.',
  imageUrl: '/manual processing.png' // Added image for manual processing
};

// --- Cow Definitions ---
export type CowTier = 'common' | 'cosmic' | 'galactic_moo_moo';

export interface Cow {
  id: string; // Unique ID for each cow instance
  tier: CowTier;
  name: string;
  rawNilkPerDayBase: number; // Base production for its tier from COW_STATS
  level: number; // Starts at 0 or 1
  currentRawNilkPerDay: number; // Calculated based on base, level, and yield booster
  accumulatedRawNilk: number; // Raw Nilk ready to be harvested
  lastHarvestTime: number; // Timestamp of the last harvest
  imageUrl?: string;
}

export interface CowStatData {
  name: string; 
  rawNilkPerDayBase: number; 
  directPurchaseCost: number; 
  fusionFee?: number; // Optional: Fee to FUSE INTO this tier
  evolutionBaseCost: number; 
  evolutionLevelMultiplier: number; 
  inputsForFusion?: { tierInput: CowTier, count: number }; // Optional: Inputs required to fuse into this tier
  imageUrl: string; 
  modelPath: string;
  description?: string;
}

export const COW_STATS: Record<CowTier, CowStatData> = {
  common: {
    name: "Common Cow",
    rawNilkPerDayBase: 5000, // 5x ACCELERATED for 2-month cycle
    directPurchaseCost: 65000, // 5x INCREASED for whale protection (1B supply)
    evolutionBaseCost: 1200, // Keep same
    evolutionLevelMultiplier: 600, // Keep same
    imageUrl: "/NILK COW.png",
    modelPath: "/MODELS/COW_optimized.glb",
    description: "A humble beginning to your Nilk empire."
    // No fusion inputs defined for Common Cow as it's the base for fusion
  },
  cosmic: {
    name: "Cosmic Cow",
    rawNilkPerDayBase: 15000, // 4.3x ACCELERATED for 2-month cycle
    directPurchaseCost: 275000, // 5x INCREASED for whale protection (1B supply)
    evolutionBaseCost: 4000, // Keep same
    evolutionLevelMultiplier: 2000, // Keep same
    inputsForFusion: { tierInput: 'common', count: 2 },
    fusionFee: 15000, // Keep same
    imageUrl: "/cosmic cow.png",
    modelPath: "/MODELS/COW_COSMIC_optimized.glb",
    description: "A stellar producer of Raw Nilk."
  },
  galactic_moo_moo: {
    name: "Galactic Moo Moo",
    rawNilkPerDayBase: 50000, // 3.3x ACCELERATED for 2-month cycle
    directPurchaseCost: 750000, // 2.5x INCREASED for whale protection (1B supply)
    evolutionBaseCost: 18000, // Keep same
    evolutionLevelMultiplier: 9000, // Keep same
    inputsForFusion: { tierInput: 'cosmic', count: 4 },
    fusionFee: 70000, // Keep same
    imageUrl: "/galactic moo moo.png",
    modelPath: "/MODELS/COW_GALACTIC_optimized.glb",
    description: "The ultimate legend in Nilk production."
  },
  // Potentially add more tiers here if needed in the future
  // legendary_lactator: { ... }
};

const MAX_COW_LEVEL = 10;
const YIELD_BOOSTER_MAX_LEVEL = 10; // Define max level for yield booster
// --- End Cow Definitions ---

// --- Flask (Consumable) Definitions ---
export type FlaskId = 'flask_of_swift_harvest' | 'flask_of_bountiful_yield' | 'flask_of_efficient_processing';

// Define structure for active flask buff
export interface ActiveFlask {
  id: FlaskId;
  name: string;
  expiryTime: number; // Timestamp when the buff expires
  effectDescription: string;
  // Specific effect values stored on activation
  cooldownReductionPercent?: number;
  yieldBoostPercent?: number;
  processingFeeReduction?: number; // Absolute reduction
}

export const FLASK_STATS: Record<FlaskId, { 
    name: string; 
    description: string; 
    costRawNilk: number; 
    costNilk: number; // Catalysis Fee
    durationHours: number; 
    image: string;
    effectDescription: string;
    cooldownReductionPercent?: number;
    yieldBoostPercent?: number;
    processingFeeReduction?: number;
}> = {
  'flask_of_swift_harvest': {
    name: 'Flask of Swift Harvest',
    description: 'Reduces harvest cooldowns for all owned cows.',
    costRawNilk: 500, // Reduced cost for better 2-month gameplay
    costNilk: 15, // Reduced catalysis fee
    durationHours: 2,
    image: '/smalljar.png', // Using small jar for swift harvest
    effectDescription: 'Harvest cooldowns reduced by 20%',
    cooldownReductionPercent: 20,
  },
  'flask_of_bountiful_yield': {
    name: 'Flask of Bountiful Yield',
    description: 'Increases the Raw Nilk per day for ALL owned cows.',
    costRawNilk: 750, // Reduced cost for better 2-month gameplay
    costNilk: 25, // Reduced catalysis fee
    durationHours: 4,
    image: '/gallonjug.png', // Using gallon jug for bountiful yield (bigger container)
    effectDescription: 'All Raw Nilk production +10%',
    yieldBoostPercent: 10,
  },
  'flask_of_efficient_processing': {
    name: 'Flask of Efficient Processing',
    description: 'Reduces the processing fee for your next conversion.',
    costRawNilk: 400, // Reduced cost for better 2-month gameplay
    costNilk: 20, // Reduced catalysis fee
    durationHours: 0, // Instant use, but we can give it a short expiry for UI purposes, e.g., 1 hour
    image: '/nilk crate.png', // Using nilk crate for highest tier flask
    effectDescription: 'Processing fee reduced by 3% on next batch',
    processingFeeReduction: 3, // Stored as absolute percentage points
  },
};

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  image: string;
  cost?: number;
  costRawNilk?: number;
  costHype?: number; // NEW: HYPE pricing option
  tier?: CowTier;
  currency: '$NILK' | 'Raw Nilk' | 'HYPE' | 'Multi'; // NEW: Support for HYPE and multi-currency
  alternativeCurrency?: {
    type: '$NILK' | 'HYPE';
    amount: number;
  }; // NEW: Alternative payment option
  category: 'cows' | 'machines' | 'flasks' | 'boosters';
  stats: Record<string, string | number>;
  isUniquePurchase?: boolean;
}

// Sample Market Items - This would ideally come from a config or store
const initialMarketItems: UpgradeItem[] = [
    {
      id: 'buy_common_cow',
      name: 'Common Cow',
      description: 'A sturdy, reliable Nilk producer. The backbone of any starting farm.',
      image: '/NILK COW.png',
      cost: COW_STATS.common.directPurchaseCost, // Use store value
      currency: '$NILK',
      tier: 'common',
      category: 'cows',
      stats: { 'Base Raw Nilk/Day': COW_STATS.common.rawNilkPerDayBase.toLocaleString() },
      isUniquePurchase: false,
    },
    {
      id: 'buy_cosmic_cow',
      name: 'Cosmic Cow',
      description: 'Infused with stellar energy, this cow yields more exotic Nilk.',
      image: '/cosmic cow.png',
      cost: COW_STATS.cosmic.directPurchaseCost, // Use store value
      currency: '$NILK',
      tier: 'cosmic',
      category: 'cows',
      stats: { 'Base Raw Nilk/Day': COW_STATS.cosmic.rawNilkPerDayBase.toLocaleString() },
      isUniquePurchase: false,
    },
    {
      id: 'buy_galactic_moomoo',
      name: 'Galactic Moo Moo',
      description: 'A legendary creature, its Nilk is the stuff of cosmic tales.',
      image: '/galactic moo moo.png',
      cost: COW_STATS.galactic_moo_moo.directPurchaseCost, // Use store value
      currency: '$NILK',
      tier: 'galactic_moo_moo',
      category: 'cows',
      stats: { 'Base Raw Nilk/Day': COW_STATS.galactic_moo_moo.rawNilkPerDayBase.toLocaleString() },
      isUniquePurchase: false,
    },
    {
      id: 'buy_standard_machine',
      name: 'Standard Nilk Machine',
      description: 'Processes Raw Nilk into $NILK with improved efficiency.',
      image: '/nilk machine.png',
      cost: 150000, // 5x INCREASED for whale protection (1B supply)
      currency: '$NILK',
      category: 'machines',
      stats: { 'Conversion Rate': '35%', 'Processing Fee': '8%', 'Speed': 'Moderate' },
      isUniquePurchase: false,
    },
    {
      id: 'buy_pro_machine',
      name: 'Pro Nilk Machine',
      description: 'Top-tier automated processing for maximum $NILK yield and speed.',
      image: '/nilk machine PRO.png',
      cost: 375000, // 5x INCREASED for whale protection (1B supply)
      currency: '$NILK',
      category: 'machines',
      stats: { 'Conversion Rate': '45%', 'Processing Fee': '4%', 'Speed': 'Fast' },
      isUniquePurchase: false,
    },
    {
      id: 'flask_of_bountiful_yield',
      name: FLASK_STATS.flask_of_bountiful_yield.name,
      description: FLASK_STATS.flask_of_bountiful_yield.description,
      image: FLASK_STATS.flask_of_bountiful_yield.image,
      cost: FLASK_STATS.flask_of_bountiful_yield.costNilk,
      costRawNilk: FLASK_STATS.flask_of_bountiful_yield.costRawNilk,
      currency: 'Raw Nilk', // Primary cost is Raw Nilk
      category: 'flasks',
      stats: { 'Effect': FLASK_STATS.flask_of_bountiful_yield.effectDescription, 'Duration': `${FLASK_STATS.flask_of_bountiful_yield.durationHours} hours` },
      isUniquePurchase: false,
    },
    {
      id: 'flask_of_swift_harvest',
      name: FLASK_STATS.flask_of_swift_harvest.name,
      description: FLASK_STATS.flask_of_swift_harvest.description,
      image: FLASK_STATS.flask_of_swift_harvest.image,
      cost: FLASK_STATS.flask_of_swift_harvest.costNilk,
      costRawNilk: FLASK_STATS.flask_of_swift_harvest.costRawNilk,
      currency: 'Raw Nilk',
      category: 'flasks',
      stats: { 'Effect': FLASK_STATS.flask_of_swift_harvest.effectDescription, 'Duration': `${FLASK_STATS.flask_of_swift_harvest.durationHours} hours` },
      isUniquePurchase: false,
    },
    {
      id: 'flask_of_efficient_processing',
      name: FLASK_STATS.flask_of_efficient_processing.name,
      description: FLASK_STATS.flask_of_efficient_processing.description,
      image: FLASK_STATS.flask_of_efficient_processing.image,
      cost: FLASK_STATS.flask_of_efficient_processing.costNilk,
      costRawNilk: FLASK_STATS.flask_of_efficient_processing.costRawNilk,
      currency: 'Raw Nilk',
      category: 'flasks',
      stats: { 'Effect': FLASK_STATS.flask_of_efficient_processing.effectDescription, 'Duration': 'Next Process' },
      isUniquePurchase: false,
    },
    {
      id: 'buy_alien_farmer_boost', // Changed ID for consistency
      name: 'Alien Farmer Expertise',
      description: 'Unlocks advanced farming techniques from across the galaxy. Permanently boosts all Raw Nilk production by 5%.',
      image: '/farmer.png',
      cost: 75000,
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Global Raw Nilk Boost': '+5% (Permanent)', 'Type': 'Farm Upgrade' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_moofi_badge', // Changed ID for consistency
      name: 'MOOFI Badge', // Changed name for consistency
      description: 'A prestigious badge for true Nilk connoisseurs. Permanently boosts final $NILK yield from processing by 10%.', // Updated description
      image: '/MOOFI badge.png',
      cost: 1000000,
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Global $NILK Yield Boost': '+10% (Permanent)', 'Type': 'Processing Upgrade' }, // Updated stats
      isUniquePurchase: true,
    },
    {
      id: 'buy_flask_blueprint',
      name: 'Flask Blueprint',
      description: 'Unlocks the ability to craft all flask types at reduced costs. One-time purchase enables crafting forever.',
      image: '/smalljar.png', // Using jar as blueprint icon
      cost: 10000, // From tokenomics
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Unlocks': 'Flask Crafting', 'Benefit': '80% Cost Reduction' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_yield_booster_1',
      name: 'Yield Booster Level 1',
      description: 'Increases Raw Nilk production for ALL cows by 10%. Stacks multiplicatively with other bonuses.',
      image: '/gallonjug.png', // Using gallon jug for yield boost
      cost: 12000, // From tokenomics
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Global Production Boost': '+10% (Permanent)', 'Affects': 'All Cows' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_yield_booster_2',
      name: 'Yield Booster Level 2',
      description: 'Further increases Raw Nilk production for ALL cows by 10% (21% total). Requires Level 1.',
      image: '/gallonjug.png',
      cost: 16800, // 12000 * 1.4
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Global Production Boost': '+10% More (21% Total)', 'Requires': 'Level 1' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_yield_booster_3',
      name: 'Yield Booster Level 3',
      description: 'Further increases Raw Nilk production for ALL cows by 10% (33.1% total). Requires Level 2.',
      image: '/gallonjug.png',
      cost: 23520, // 16800 * 1.4
      currency: '$NILK',
      category: 'boosters',
      stats: { 'Global Production Boost': '+10% More (33.1% Total)', 'Requires': 'Level 2' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_hype_liquidity_starter',
      name: 'HYPE Liquidity Starter Pack',
      description: 'Get started with NILK/HYPE liquidity mining! Includes 50 HYPE tokens to pair with your NILK.',
      image: '/hyperliquid.png',
      cost: 25000, // 25k NILK for 50 HYPE (500:1 ratio)
      currency: '$NILK',
      category: 'boosters',
      stats: { 'HYPE Tokens': '50', 'Purpose': 'Liquidity Mining' },
      isUniquePurchase: false,
    },
    {
      id: 'buy_premium_lp_boost',
      name: 'Premium LP Boost',
      description: 'Permanently increases liquidity mining rewards by 25%. Essential for serious liquidity providers.',
      image: '/MOOFI badge.png',
      cost: 100000,
      currency: 'Multi',
      alternativeCurrency: { type: 'HYPE', amount: 200 },
      category: 'boosters',
      stats: { 'LP Reward Boost': '+25% (Permanent)', 'Type': 'Liquidity Upgrade' },
      isUniquePurchase: true,
    },
    {
      id: 'buy_common_cow_hype',
      name: 'Common Cow (HYPE)',
      description: 'Purchase a Common Cow with HYPE tokens. Same stats, different payment method.',
      image: '/NILK COW.png',
      costHype: 26, // ~13k NILK at 500:1 ratio
      currency: 'HYPE',
      tier: 'common',
      category: 'cows',
      stats: { 'Base Raw Nilk/Day': COW_STATS.common.rawNilkPerDayBase.toLocaleString() },
      isUniquePurchase: false,
    },
    {
      id: 'buy_cosmic_cow_hype',
      name: 'Cosmic Cow (HYPE)',
      description: 'Purchase a Cosmic Cow with HYPE tokens. Premium payment for premium cow.',
      image: '/cosmic cow.png',
      costHype: 110, // ~55k NILK at 500:1 ratio
      currency: 'HYPE',
      tier: 'cosmic',
      category: 'cows',
      stats: { 'Base Raw Nilk/Day': COW_STATS.cosmic.rawNilkPerDayBase.toLocaleString() },
      isUniquePurchase: false,
    },
    {
      id: 'buy_hype_processing_boost',
      name: 'HYPE Processing Boost',
      description: 'Reduces processing fees by 50% for 24 hours. HYPE-exclusive benefit.',
      image: '/nilk machine PRO.png',
      costHype: 5,
      currency: 'HYPE',
      category: 'boosters',
      stats: { 'Fee Reduction': '50%', 'Duration': '24 Hours' },
      isUniquePurchase: false,
    },
  ];

export interface GameState {
  userNilkBalance: number;
  userRawNilkBalance: number;
  userHypeBalance: number; // NEW: HYPE balance for Hyperliquid integration
  treasuryBalance: number;
  treasuryHypeBalance: number; // NEW: Treasury HYPE for rewards and marketplace
  ownedMachines: Record<Exclude<MachineType, 'manual'>, number>;
  ownedCows: Cow[];
  yieldBoosterLevel: number;
  nextCowId: number; // Simple counter for unique cow IDs
  lastGlobalHarvestTime: number; // Timestamp of the last global harvest all
  hasMoofiBadge: boolean;
  hasAlienFarmerBoost: boolean;
  hasFlaskBlueprint: boolean; // NEW: Flask crafting ability
  activeFlask: ActiveFlask | null; // Replaces activeConsumable
  marketItems: UpgradeItem[];
  
  // NEW: Dynamic pricing state
  dynamicPricing: {
    hyePrice: number;
    lastPriceUpdate: number;
    estimatedNilkUSD: number; // Estimated $NILK value in USD
  };
  
  // NEW: Enhanced Liquidity Mining System
  liquidityPools: {
    nilkHype: {
      userLpTokens: number; // User's LP token balance
      totalLpTokens: number; // Total LP tokens in existence
      nilkReserve: number; // NILK in the pool
      hypeReserve: number; // HYPE in the pool
      rewardsAccumulated: number; // Pending rewards to claim
      lastRewardTime: number; // Last time rewards were calculated
      tradingFeeRate: number; // Trading fee percentage (0.3%)
      totalFeesCollected: number; // Total fees collected for analytics
    };
  };
  
  // NEW: Achievement-based HYPE rewards
  hypeRewards: {
    dailyProcessingBonus: number; // HYPE earned from daily processing
    fusionMilestones: number; // HYPE earned from fusion achievements
    liquidityMilestones: number; // HYPE earned from LP milestones
    lastDailyRewardClaim: number; // Timestamp of last daily reward
  };
  
  // Profile data
  userProfile: {
    username: string | null;
    avatarUrl: string | null;
    xHandle: string | null;
    isProfileComplete: boolean;
  };
  
  // Real-time and sync state
  autoSaveIntervalId?: NodeJS.Timeout;
  accumulationIntervalId?: NodeJS.Timeout;
}

export interface GameActions {
  increaseNilkBalance: (amount: number) => void;
  decreaseNilkBalance: (amount: number) => void;
  setNilkBalance: (amount: number) => void;
  increaseRawNilkBalance: (amount: number) => void;
  decreaseRawNilkBalance: (amount: number) => void;
  setRawNilkBalance: (amount: number) => void;
  increaseHypeBalance: (amount: number) => void; // NEW: HYPE balance management
  decreaseHypeBalance: (amount: number) => void; // NEW: HYPE balance management
  setHypeBalance: (amount: number) => void; // NEW: HYPE balance management
  increaseTreasuryBalance: (amount: number) => void;
  addOwnedMachine: (machineId: Exclude<MachineType, 'manual'>) => void;
  performMachineFusion: () => void;
  
  // Cow Actions
  purchaseCow: (tier: CowTier, quantity: number) => boolean;
  evolveCow: (cowId: string) => boolean;
  fuseCows: (inputCowIds: string[], outputTier: CowTier) => boolean;
  harvestRawNilkFromCow: (cowId: string) => void;
  harvestAllRawNilk: () => void;
  updateCowProductionRates: () => void;

  // Farm Upgrades & Boosters
  upgradeYieldBooster: () => boolean;
  purchaseMoofiBadge: () => boolean;
  purchaseAlienFarmerBoost: () => boolean;
  purchaseFlaskBlueprint: () => boolean;
  
  // Flask Actions
  craftFlask: (flaskId: FlaskId) => boolean;
  clearExpiredFlask: () => void;

  // Marketplace Action
  purchaseMarketItem: (itemId: string, quantity: number) => boolean;

  // Processing - Retained as is, actual logic for machine choice is in ProcessingPage
  processRawNilk: (amountToConvert: number) => boolean; 

  // Database Sync Actions
  syncStateFromSupabase: (supabaseState: any) => void;
  startAutoSave: (userId: string) => void;
  stopAutoSave: () => void;
  
  // Real-time Actions
  startRealTimeAccumulation: () => void;
  stopRealTimeAccumulation: () => void;
  _simulateAccumulation: (deltaTimeSeconds: number) => void;
  
  // Liquidity Mining Actions
  addLiquidity: (nilkAmount: number, hypeAmount: number) => boolean;
  removeLiquidity: (lpTokenAmount: number) => boolean;
  claimLiquidityRewards: () => number;
  calculateLiquidityRewards: () => number;
  
  // Profile Actions
  updateProfile: (profileData: { username?: string; avatarUrl?: string; xHandle?: string }) => void;
  setProfileComplete: (isComplete: boolean) => void;
  
  // Dynamic Pricing Actions
  updateHYPEPrice: (price: number) => void;
  calculateDynamicHYPEPrice: (nilkAmount: number) => number;
  updateNilkUSDEstimate: (usdValue: number) => void;
}

interface GameStore extends GameState {
  actions: GameActions;
}

// Helper function to calculate production
const calculateCowProduction = (cow: Cow, yieldBoosterLevel: number, hasAlienFarmerBoost: boolean): number => {
  let production = COW_STATS[cow.tier].rawNilkPerDayBase;
  // Apply evolution bonus (15% per level, compounding)
  for (let i = 0; i < cow.level; i++) {
    production *= 1.15;
  }
  // Apply Yield Booster bonus (10% per level, compounding)
  for (let i = 0; i < yieldBoosterLevel; i++) {
    production *= 1.10;
  }
  // Apply Alien Farmer Expertise bonus (5% to all Raw Nilk production, compounding)
  if (hasAlienFarmerBoost) {
    production *= 1.05;
  }
  return parseFloat(production.toFixed(2)); // Keep it to 2 decimal places
};

const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      userNilkBalance: 50000, // BOOSTED starting balance for 2-month cycle
      userRawNilkBalance: 5000,
      userHypeBalance: 100, // Starting HYPE balance for testing
      treasuryBalance: 1000000,
      treasuryHypeBalance: 10000, // Treasury HYPE for rewards and marketplace
  ownedMachines: { standard: 0, pro: 0 },
  ownedCows: [],
  yieldBoosterLevel: 0,
  nextCowId: 1,
  lastGlobalHarvestTime: 0,
  hasMoofiBadge: false,
  hasAlienFarmerBoost: false,
  hasFlaskBlueprint: false, // NEW: Flask crafting ability
  activeFlask: null,
      marketItems: initialMarketItems,
      
      // NEW: Dynamic pricing state
      dynamicPricing: {
        hyePrice: 42,
        lastPriceUpdate: Date.now(),
        estimatedNilkUSD: 0, // Estimated $NILK value in USD
      },
      
      // NEW: Enhanced Liquidity Mining System
      liquidityPools: {
        nilkHype: {
          userLpTokens: 0,
          totalLpTokens: 1000000, // Initial pool size
          nilkReserve: 500000, // Initial NILK in pool
          hypeReserve: 1000, // Initial HYPE in pool (500:1 ratio)
          rewardsAccumulated: 0,
          lastRewardTime: Date.now(),
          tradingFeeRate: 0.003, // 0.3% trading fee
          totalFeesCollected: 0,
        },
      },
      
      // NEW: Achievement-based HYPE rewards
      hypeRewards: {
        dailyProcessingBonus: 0,
        fusionMilestones: 0,
        liquidityMilestones: 0,
        lastDailyRewardClaim: 0,
      },
      
      // Profile data
      userProfile: {
        username: null,
        avatarUrl: null,
        xHandle: null,
        isProfileComplete: false,
      },
      
      // Real-time and sync state (not persisted)
      autoSaveIntervalId: undefined,
      accumulationIntervalId: undefined,

  actions: {
    increaseNilkBalance: (amount) => set((state) => ({ userNilkBalance: state.userNilkBalance + amount })),
    decreaseNilkBalance: (amount) => set((state) => ({ userNilkBalance: Math.max(0, state.userNilkBalance - amount) })),
    setNilkBalance: (amount) => set((state) => ({ userNilkBalance: amount })),
    increaseRawNilkBalance: (amount) => set((state) => ({ userRawNilkBalance: state.userRawNilkBalance + amount })),
    decreaseRawNilkBalance: (amount) => set((state) => ({ userRawNilkBalance: Math.max(0, state.userRawNilkBalance - amount) })),
    setRawNilkBalance: (amount) => set((state) => ({ userRawNilkBalance: amount })),
    increaseHypeBalance: (amount) => set((state) => ({ userHypeBalance: state.userHypeBalance + amount })),
    decreaseHypeBalance: (amount) => set((state) => ({ userHypeBalance: Math.max(0, state.userHypeBalance - amount) })),
    setHypeBalance: (amount) => set((state) => ({ userHypeBalance: amount })),
    increaseTreasuryBalance: (amount) => set((state) => ({ treasuryBalance: state.treasuryBalance + amount })),
    
    addOwnedMachine: (machineId) => {
      set((state) => ({
        ownedMachines: {
          ...state.ownedMachines,
          [machineId]: (state.ownedMachines[machineId] || 0) + 1,
        },
      }));
    },
    performMachineFusion: () => {
      const state = get();
      const fusionCost = MACHINES.pro.fusionCostNilk;
      if (fusionCost === undefined) {
          console.error("Pro machine fusion cost is not defined");
          return; // void is fine if GameActions for this is void
      }
      if (state.ownedMachines.standard >= 2 && state.userNilkBalance >= fusionCost) {
        set({
          userNilkBalance: state.userNilkBalance - fusionCost,
          treasuryBalance: state.treasuryBalance + fusionCost,
          ownedMachines: {
            ...state.ownedMachines,
            standard: state.ownedMachines.standard - 2,
            pro: (state.ownedMachines.pro || 0) + 1,
          },
        });
      } // Missing return true/false if GameActions expects boolean
    },

    updateCowProductionRates: () => {
      set(state => {
        const newOwnedCows = state.ownedCows.map(cow => {
          const newProductionRate = calculateCowProduction(cow, state.yieldBoosterLevel, state.hasAlienFarmerBoost);
          if (newProductionRate !== cow.currentRawNilkPerDay) {
            return { ...cow, currentRawNilkPerDay: newProductionRate };
          }
          return cow;
        });
        if (JSON.stringify(newOwnedCows) !== JSON.stringify(state.ownedCows)) {
          return { ...state, ownedCows: newOwnedCows };
        }
        return state;
      });
    },

    purchaseCow: (tier: CowTier, quantity: number) => {
      const state = get();
      const cowStat = COW_STATS[tier];
      if (quantity <= 0) return false;
      const totalCost = cowStat.directPurchaseCost * quantity;
      if (state.userNilkBalance < totalCost) return false;
      const newCows: Cow[] = [];
      let currentNextCowId = state.nextCowId;
      for (let i = 0; i < quantity; i++) {
        newCows.push({
          id: 'cow_' + currentNextCowId,
          tier: tier,
          name: cowStat.name,
          rawNilkPerDayBase: cowStat.rawNilkPerDayBase,
          level: 0, 
          currentRawNilkPerDay: 0,
          accumulatedRawNilk: 0,
          lastHarvestTime: Date.now(),
          imageUrl: cowStat.imageUrl,
        });
        currentNextCowId++;
      }
                set({
          userNilkBalance: state.userNilkBalance - totalCost,
          treasuryBalance: state.treasuryBalance + totalCost,
          ownedCows: [...state.ownedCows, ...newCows],
          nextCowId: currentNextCowId,
        });
        // Update production rates after purchase
        const newState = get();
        const updatedCows = newState.ownedCows.map(cow => ({
          ...cow,
          currentRawNilkPerDay: calculateCowProduction(cow, newState.yieldBoosterLevel, newState.hasAlienFarmerBoost)
        }));
        set({ ownedCows: updatedCows }); 
        return true;
    },

    evolveCow: (cowId: string) => {
      const state = get();
      const cowIndex = state.ownedCows.findIndex(c => c.id === cowId);
      if (cowIndex === -1) return false;
      const cow = state.ownedCows[cowIndex];
      if (cow.level >= MAX_COW_LEVEL) return false;
      const cowStatDetails = COW_STATS[cow.tier];
      const cost = cowStatDetails.evolutionBaseCost + (cow.level * cowStatDetails.evolutionLevelMultiplier);
      if (state.userNilkBalance >= cost) {
        const newOwnedCowsList = [...state.ownedCows];
        newOwnedCowsList[cowIndex] = { ...cow, level: cow.level + 1 };
        set({
          userNilkBalance: state.userNilkBalance - cost,
          treasuryBalance: state.treasuryBalance + cost,
          ownedCows: newOwnedCowsList,
        });
        // Update production rates after evolution
        const newState = get();
        const updatedCows = newState.ownedCows.map(cow => ({
          ...cow,
          currentRawNilkPerDay: calculateCowProduction(cow, newState.yieldBoosterLevel, newState.hasAlienFarmerBoost)
        }));
        set({ ownedCows: updatedCows });
        return true;
      }
      return false;
    },
    
    fuseCows: (inputCowIds: string[], outputTier: CowTier) => {
      const state = get();
      const outputCowStat = COW_STATS[outputTier];
      if (!outputCowStat.inputsForFusion || typeof outputCowStat.fusionFee !== 'number') return false;
      const { tierInput, count: inputCount } = outputCowStat.inputsForFusion;
      const fusionFee = outputCowStat.fusionFee;
      const inputCows = state.ownedCows.filter(c => inputCowIds.includes(c.id) && c.tier === tierInput);
      if (inputCows.length !== inputCount) return false;
      if (state.userNilkBalance >= fusionFee) {
        const remainingCows = state.ownedCows.filter(c => !inputCowIds.includes(c.id));
        const newFusedCow: Cow = {
          id: 'cow_' + state.nextCowId,
          tier: outputTier,
          name: outputCowStat.name,
          rawNilkPerDayBase: outputCowStat.rawNilkPerDayBase,
          level: 0, 
          currentRawNilkPerDay: 0,
          accumulatedRawNilk: 0,
          lastHarvestTime: Date.now(),
          imageUrl: outputCowStat.imageUrl,
        };
        set({
          userNilkBalance: state.userNilkBalance - fusionFee,
          treasuryBalance: state.treasuryBalance + fusionFee,
          ownedCows: [...remainingCows, newFusedCow],
          nextCowId: state.nextCowId + 1,
        });
        // Update production rates after fusion
        const newState = get();
        const updatedCows = newState.ownedCows.map(cow => ({
          ...cow,
          currentRawNilkPerDay: calculateCowProduction(cow, newState.yieldBoosterLevel, newState.hasAlienFarmerBoost)
        }));
        set({ ownedCows: updatedCows });
        return true;
      }
      return false;
    },

    harvestRawNilkFromCow: (cowId: string) => {
      set(state => {
        const cowIndex = state.ownedCows.findIndex(c => c.id === cowId);
        if (cowIndex === -1) return state;
        const cow = state.ownedCows[cowIndex];
        let amountToHarvest = cow.accumulatedRawNilk;
        if (amountToHarvest === 0 && cow.currentRawNilkPerDay > 0) { 
            const hoursSinceLastHarvest = (Date.now() - cow.lastHarvestTime) / (1000 * 60 * 60);
            let actualCooldownHours = 24; 
            if (state.activeFlask && state.activeFlask.expiryTime > Date.now() && state.activeFlask.cooldownReductionPercent) {
                actualCooldownHours *= (1 - state.activeFlask.cooldownReductionPercent / 100);
            }
            if (hoursSinceLastHarvest >= actualCooldownHours / 24) {
                 amountToHarvest = cow.currentRawNilkPerDay * Math.min(hoursSinceLastHarvest / 24, 1); 
            }
        }
        amountToHarvest = parseFloat(amountToHarvest.toFixed(2));
        if (state.activeFlask && state.activeFlask.expiryTime > Date.now() && state.activeFlask.yieldBoostPercent) {
            amountToHarvest *= (1 + state.activeFlask.yieldBoostPercent / 100);
        }
        amountToHarvest = parseFloat(amountToHarvest.toFixed(2));
        if (amountToHarvest <= 0) return state;
        const newOwnedCows = [...state.ownedCows];
        newOwnedCows[cowIndex] = { ...cow, accumulatedRawNilk: 0, lastHarvestTime: Date.now() };
        return { ...state, userRawNilkBalance: state.userRawNilkBalance + amountToHarvest, ownedCows: newOwnedCows };
      });
    },

    harvestAllRawNilk: () => {
      set(state => {
        let totalHarvested = 0;
        const updatedCows = state.ownedCows.map(cow => {
            let amountToHarvest = cow.accumulatedRawNilk;
            if (amountToHarvest === 0 && cow.currentRawNilkPerDay > 0) {
                const hoursSinceLastHarvest = (Date.now() - cow.lastHarvestTime) / (1000 * 60 * 60);
                let actualCooldownHours = 24;
                if (state.activeFlask && state.activeFlask.expiryTime > Date.now() && state.activeFlask.cooldownReductionPercent) {
                    actualCooldownHours *= (1 - state.activeFlask.cooldownReductionPercent / 100);
                }
                if (hoursSinceLastHarvest >= actualCooldownHours / 24) {
                    amountToHarvest = cow.currentRawNilkPerDay * Math.min(hoursSinceLastHarvest / 24, 1); 
                }
            }
            amountToHarvest = parseFloat(amountToHarvest.toFixed(2));
            if (state.activeFlask && state.activeFlask.expiryTime > Date.now() && state.activeFlask.yieldBoostPercent) {
                amountToHarvest *= (1 + state.activeFlask.yieldBoostPercent / 100);
            }
            amountToHarvest = parseFloat(amountToHarvest.toFixed(2));
            if (amountToHarvest > 0) {
                totalHarvested += amountToHarvest;
                return { ...cow, accumulatedRawNilk: 0, lastHarvestTime: Date.now() };
            }
            return cow;
        });
        if (totalHarvested > 0) {
          return { ...state, userRawNilkBalance: state.userRawNilkBalance + totalHarvested, ownedCows: updatedCows };
        }
        return state;
      });
    },
    _simulateAccumulation: (deltaTimeSeconds: number) => {
        set(state => {
            let newState: Partial<GameState> = {};
            let changed = false;

            if (state.activeFlask && state.activeFlask.expiryTime <= Date.now()) {
                newState.activeFlask = null;
                changed = true;
            }

            const currentOwnedCows = newState.activeFlask === null ? state.ownedCows.map(c=>({...c})) : state.ownedCows; 

            const newOwnedCows = currentOwnedCows.map(cow => {
                const productionPerSecond = cow.currentRawNilkPerDay / (24 * 60 * 60);
                if (productionPerSecond === 0 && cow.accumulatedRawNilk === 0) return cow;
                let newAccumulation = cow.accumulatedRawNilk + (productionPerSecond * deltaTimeSeconds);
                newAccumulation = parseFloat(newAccumulation.toFixed(4));
                if (newAccumulation !== cow.accumulatedRawNilk) {
                    if (!changed) changed = true; // Ensure changed is true if only accumulation happened
                    return { ...cow, accumulatedRawNilk: newAccumulation };
                }
                return cow;
            });

            if (changed) {
                newState.ownedCows = newOwnedCows;
                return { ...state, ...newState };
            }
            return state;
        });
    },

    upgradeYieldBooster: () => {
      const state = get();
      const currentLevel = state.yieldBoosterLevel;
      if (currentLevel >= YIELD_BOOSTER_MAX_LEVEL) return false;
      let cost = 12000; 
      if (currentLevel > 0) {
        cost = 12000 * Math.pow(1.4, currentLevel); 
      }
      cost = Math.floor(cost);
      if (state.userNilkBalance >= cost) {
        set({
          userNilkBalance: state.userNilkBalance - cost,
          treasuryBalance: state.treasuryBalance + cost,
          yieldBoosterLevel: currentLevel + 1,
        });
        get().actions.updateCowProductionRates(); 
        return true;
      }
      return false;
    },

    purchaseMoofiBadge: () => {
      const state = get();
      const MOOFI_BADGE_COST = 1000000;
      if (state.hasMoofiBadge) {
        console.warn("[purchaseMoofiBadge] MOOFI Badge already owned.");
        return false;
      }
      if (state.userNilkBalance < MOOFI_BADGE_COST) {
        console.warn(`[purchaseMoofiBadge] Insufficient NILK. Need: ${MOOFI_BADGE_COST}, Have: ${state.userNilkBalance}`);
        return false;
      }
      set(currentState => ({
        userNilkBalance: currentState.userNilkBalance - MOOFI_BADGE_COST,
        treasuryBalance: currentState.treasuryBalance + MOOFI_BADGE_COST,
        hasMoofiBadge: true,
        }));
      console.log("[purchaseMoofiBadge] MOOFI Badge purchased successfully.");
        return true;
    },

    purchaseAlienFarmerBoost: () => {
      const cost = 75000; // Example cost, define properly
      if (get().hasAlienFarmerBoost) return false;
      if (get().userNilkBalance < cost) {
        return false;
      }
      get().actions.decreaseNilkBalance(cost);
      get().actions.increaseTreasuryBalance(cost);
      set({ hasAlienFarmerBoost: true });
      get().actions.updateCowProductionRates(); // Recalculate production after boost
      return true;
    },

    purchaseFlaskBlueprint: () => {
      const cost = 10000; // From tokenomics
      if (get().hasFlaskBlueprint) return false;
      if (get().userNilkBalance < cost) {
        return false;
      }
      get().actions.decreaseNilkBalance(cost);
      get().actions.increaseTreasuryBalance(cost);
      set({ hasFlaskBlueprint: true });
      return true;
    },

    // --- Flask (Consumable) Actions ---
    craftFlask: (flaskId) => {
      const flaskToCraft = FLASK_STATS[flaskId];
      if (!flaskToCraft) return false;

      const { userNilkBalance, userRawNilkBalance } = get();

      if (userNilkBalance < flaskToCraft.costNilk) {
        console.error("Not enough $NILK to craft flask.");
        return false;
      }
      if (userRawNilkBalance < flaskToCraft.costRawNilk) {
        console.error("Not enough Raw Nilk to craft flask.");
        return false;
      }

      // Deduct costs and send $NILK fee to treasury
      get().actions.decreaseNilkBalance(flaskToCraft.costNilk);
      get().actions.decreaseRawNilkBalance(flaskToCraft.costRawNilk);
      get().actions.increaseTreasuryBalance(flaskToCraft.costNilk);

      // Set the active flask buff
      const expiryTime = Date.now() + flaskToCraft.durationHours * 60 * 60 * 1000;
      set({ 
        activeFlask: {
          id: flaskId,
          name: flaskToCraft.name,
          expiryTime: expiryTime,
          effectDescription: flaskToCraft.effectDescription,
          cooldownReductionPercent: flaskToCraft.cooldownReductionPercent,
          yieldBoostPercent: flaskToCraft.yieldBoostPercent,
          processingFeeReduction: flaskToCraft.processingFeeReduction,
        }
      });
      
      // If it's a yield-boosting flask, update cow production rates immediately
      if (flaskToCraft.yieldBoostPercent) {
        get().actions.updateCowProductionRates();
      }

      return true;
    },

    clearExpiredFlask: () => {
      const { activeFlask } = get();
      if (activeFlask && Date.now() > activeFlask.expiryTime) {
        const hadYieldBoost = !!activeFlask.yieldBoostPercent;
        set({ activeFlask: null });
        // If the expired flask was a yield booster, we must recalculate cow production rates
        if (hadYieldBoost) {
          get().actions.updateCowProductionRates();
        }
      }
    },

    // --- Processing ---
    processRawNilk: (amountToConvert) => {
      // This is a placeholder, full logic is in ProcessingPage.tsx
      console.warn("[Store processRawNilk] This action is basic and likely outdated. Ensure app/processing/page.tsx is used for correct machine-based processing.");
      
      if (amountToConvert <= 0) {
        console.error("[Store processRawNilk] Amount to convert must be positive.");
        return false; // Return boolean
      }
      if (get().userRawNilkBalance < amountToConvert) {
        console.error("[Store processRawNilk] Insufficient Raw Nilk to process.");
        return false; // Return boolean
      }

      // This is the OLD, simplified logic. The app/processing/page.tsx contains the correct, machine-based logic.
      const baseConversionRate = 0.1; 
      let actualConversionRate = baseConversionRate;
      if (get().hasMoofiBadge) { // Old MOOFI badge effect, not aligned with new +10% final yield.
        actualConversionRate *= 1.05; 
      }
      const nilkYield = amountToConvert * actualConversionRate;

      get().actions.decreaseRawNilkBalance(amountToConvert);
      get().actions.increaseNilkBalance(nilkYield);

      console.log(`[Store processRawNilk] Processed ${amountToConvert} Raw Nilk into ${nilkYield.toFixed(2)} $NILK (using outdated store logic).`);
      return true; // Ensure boolean is returned
    },

        purchaseMarketItem: (itemId, quantity) => {
          const item = get().marketItems.find(i => i.id === itemId);
          if (!item) {
            console.error(`[purchaseMarketItem] Item with id ${itemId} not found.`);
            return false;
          }

          const totalNilkCost = (item.cost ?? 0) * quantity;
          const totalRawNilkCost = (item.costRawNilk ?? 0) * quantity;
          const state = get();

          // Check for sufficient funds
          if (state.userNilkBalance < totalNilkCost) {
            console.error(`[purchaseMarketItem] Insufficient $NILK balance.`);
            return false;
          }
          if (state.userRawNilkBalance < totalRawNilkCost) {
            console.error(`[purchaseMarketItem] Insufficient Raw Nilk balance.`);
            return false;
          }

          // This pattern of calling actions within other actions is valid in Zustand
          set((prevState) => ({
            userNilkBalance: prevState.userNilkBalance - totalNilkCost,
            userRawNilkBalance: prevState.userRawNilkBalance - totalRawNilkCost,
          }));

          // Add item to inventory based on category
          switch (item.category) {
            case 'cows':
              if (item.tier) {
                // Call purchaseCow action directly
                const actions = get().actions;
                actions.purchaseCow(item.tier, quantity);
              }
              break;
            case 'machines':
              if (item.id === 'buy_standard_machine') {
                set((prevState) => ({
                  ownedMachines: {
                    ...prevState.ownedMachines,
                    standard: prevState.ownedMachines.standard + quantity,
                  },
                }));
              } else if (item.id === 'buy_pro_machine') {
                set((prevState) => ({
                  ownedMachines: {
                    ...prevState.ownedMachines,
                    pro: prevState.ownedMachines.pro + quantity,
                  },
                }));
              }
              break;
            case 'flasks':
              if (item.id in FLASK_STATS) {
                // Flask crafting logic would go here
                console.log(`Crafted ${quantity} ${item.name}`);
              }
              break;
            case 'boosters':
              if (item.id === 'buy_alien_farmer_boost') {
                set({ hasAlienFarmerBoost: true });
                get().actions.updateCowProductionRates(); // Update production after boost
              } else if (item.id === 'buy_moofi_badge') {
                set({ hasMoofiBadge: true });
              } else if (item.id === 'buy_flask_blueprint') {
                set({ hasFlaskBlueprint: true });
              } else if (item.id === 'buy_hype_liquidity_starter') {
                // Add 50 HYPE tokens to user balance
                set((prevState) => ({
                  userHypeBalance: prevState.userHypeBalance + 50,
                }));
              } else if (item.id === 'buy_premium_lp_boost') {
                // This would set a permanent boost flag - for now just log
                console.log('Premium LP Boost purchased - 25% reward increase activated');
              } else if (item.id.startsWith('buy_yield_booster_')) {
                const level = parseInt(item.id.split('_').pop() || '0');
                set({ yieldBoosterLevel: level });
                get().actions.updateCowProductionRates(); // Update production after yield boost
              }
              break;
            default:
              console.error(`[purchaseMarketItem] Unknown item category: ${item.category}`);
              // Refund the user if the category is unknown
              set((prevState) => ({
                userNilkBalance: prevState.userNilkBalance + totalNilkCost,
                userRawNilkBalance: prevState.userRawNilkBalance + totalRawNilkCost,
              }));
              return false;
          }

          console.log(`Successfully purchased ${quantity} of ${item.name}.`);
          return true;
        },

         // Database Sync Actions
     syncStateFromSupabase: (supabaseState: any) => {
       set((state) => ({
         ...state,
         userNilkBalance: supabaseState.userNilkBalance ?? state.userNilkBalance,
         userRawNilkBalance: supabaseState.userRawNilkBalance ?? state.userRawNilkBalance,
         ownedCows: supabaseState.ownedCows ?? state.ownedCows,
         ownedMachines: supabaseState.ownedMachines ?? state.ownedMachines,
         yieldBoosterLevel: supabaseState.yieldBoosterLevel ?? state.yieldBoosterLevel,
         hasMoofiBadge: supabaseState.hasMoofiBadge ?? state.hasMoofiBadge,
         hasAlienFarmerBoost: supabaseState.hasAlienFarmerBoost ?? state.hasAlienFarmerBoost,
       }));
       // Update cow production rates after sync
       get().actions.updateCowProductionRates();
       
       // Check for achievements after sync
       const currentState = get();
       achievementManager.checkAchievements(currentState);
     },

     startAutoSave: (userId: string) => {
       const state = get();
       if (state.autoSaveIntervalId) {
         clearInterval(state.autoSaveIntervalId);
       }
       
       const intervalId = setInterval(async () => {
         const currentState = get();
         try {
           const { saveGameStateToSupabase } = await import('./supabase-sync');
           await saveGameStateToSupabase(userId, currentState);
         } catch (error) {
           console.error('[Auto Save] Failed to save game state:', error);
         }
       }, 30000); // Save every 30 seconds
       
       set({ autoSaveIntervalId: intervalId });
     },

     stopAutoSave: () => {
       const state = get();
       if (state.autoSaveIntervalId) {
         clearInterval(state.autoSaveIntervalId);
         set({ autoSaveIntervalId: undefined });
       }
     },
     
     // Real-time Actions
     startRealTimeAccumulation: () => {
       const state = get();
       if (state.accumulationIntervalId) {
         clearInterval(state.accumulationIntervalId);
       }
       
       let lastUpdateTime = Date.now();
       const intervalId = setInterval(() => {
         const currentTime = Date.now();
         const deltaTimeSeconds = (currentTime - lastUpdateTime) / 1000;
         lastUpdateTime = currentTime;
         
         get().actions._simulateAccumulation(deltaTimeSeconds);
       }, 5000); // Update every 5 seconds
       
       set({ accumulationIntervalId: intervalId });
     },

     stopRealTimeAccumulation: () => {
       const state = get();
       if (state.accumulationIntervalId) {
         clearInterval(state.accumulationIntervalId);
         set({ accumulationIntervalId: undefined });
       }
     },

     _simulateAccumulation: (deltaTimeSeconds: number) => {
       // Simulate Raw Nilk accumulation for all cows
       set(state => {
         const updatedCows = state.ownedCows.map(cow => {
           const rawNilkPerSecond = cow.currentRawNilkPerDay / (24 * 60 * 60);
           const newAccumulation = cow.accumulatedRawNilk + (rawNilkPerSecond * deltaTimeSeconds);
           return { ...cow, accumulatedRawNilk: parseFloat(newAccumulation.toFixed(2)) };
         });
         return { ...state, ownedCows: updatedCows };
       });
       
       // Update liquidity rewards
       get().actions.calculateLiquidityRewards();
     },

     // Liquidity Mining Actions
     addLiquidity: (nilkAmount: number, hypeAmount: number) => {
       const state = get();
       const pool = state.liquidityPools.nilkHype;
       
       // Check if user has enough tokens
       if (state.userNilkBalance < nilkAmount || state.userHypeBalance < hypeAmount) {
         console.error('[addLiquidity] Insufficient balance');
         return false;
       }
       
       // Calculate LP tokens to mint (using geometric mean for first liquidity)
       let lpTokensToMint: number;
       if (pool.totalLpTokens === 0) {
         lpTokensToMint = Math.sqrt(nilkAmount * hypeAmount);
       } else {
         // Proportional to existing pool
         const nilkShare = nilkAmount / pool.nilkReserve;
         const hypeShare = hypeAmount / pool.hypeReserve;
         const minShare = Math.min(nilkShare, hypeShare);
         lpTokensToMint = minShare * pool.totalLpTokens;
       }
       
       // Update state
       set((prevState) => ({
         userNilkBalance: prevState.userNilkBalance - nilkAmount,
         userHypeBalance: prevState.userHypeBalance - hypeAmount,
         liquidityPools: {
           nilkHype: {
             ...prevState.liquidityPools.nilkHype,
             userLpTokens: prevState.liquidityPools.nilkHype.userLpTokens + lpTokensToMint,
             totalLpTokens: prevState.liquidityPools.nilkHype.totalLpTokens + lpTokensToMint,
             nilkReserve: prevState.liquidityPools.nilkHype.nilkReserve + nilkAmount,
             hypeReserve: prevState.liquidityPools.nilkHype.hypeReserve + hypeAmount,
           },
         },
       }));
       
       console.log(`[addLiquidity] Added ${nilkAmount} NILK + ${hypeAmount} HYPE, received ${lpTokensToMint.toFixed(2)} LP tokens`);
       return true;
     },

     removeLiquidity: (lpTokenAmount: number) => {
       const state = get();
       const pool = state.liquidityPools.nilkHype;
       
       if (pool.userLpTokens < lpTokenAmount) {
         console.error('[removeLiquidity] Insufficient LP tokens');
         return false;
       }
       
       // Calculate proportional withdrawal
       const share = lpTokenAmount / pool.totalLpTokens;
       const nilkToWithdraw = share * pool.nilkReserve;
       const hypeToWithdraw = share * pool.hypeReserve;
       
       // Claim any pending rewards first
       get().actions.claimLiquidityRewards();
       
       // Update state
       set((prevState) => ({
         userNilkBalance: prevState.userNilkBalance + nilkToWithdraw,
         userHypeBalance: prevState.userHypeBalance + hypeToWithdraw,
         liquidityPools: {
           nilkHype: {
             ...prevState.liquidityPools.nilkHype,
             userLpTokens: prevState.liquidityPools.nilkHype.userLpTokens - lpTokenAmount,
             totalLpTokens: prevState.liquidityPools.nilkHype.totalLpTokens - lpTokenAmount,
             nilkReserve: prevState.liquidityPools.nilkHype.nilkReserve - nilkToWithdraw,
             hypeReserve: prevState.liquidityPools.nilkHype.hypeReserve - hypeToWithdraw,
           },
         },
       }));
       
       console.log(`[removeLiquidity] Removed ${lpTokenAmount.toFixed(2)} LP tokens, received ${nilkToWithdraw.toFixed(2)} NILK + ${hypeToWithdraw.toFixed(2)} HYPE`);
       return true;
     },

     calculateLiquidityRewards: () => {
       const state = get();
       const pool = state.liquidityPools.nilkHype;
       
       if (pool.userLpTokens === 0) return 0;
       
       // Enhanced reward calculation with dynamic scaling
       const hoursElapsed = (Date.now() - pool.lastRewardTime) / (1000 * 60 * 60);
       const userPoolShare = pool.userLpTokens / pool.totalLpTokens;
       
       // Dynamic APR: Higher rewards for smaller pools (25% base, up to 50% for small pools)
       const poolSizeMultiplier = Math.max(1, 100000 / pool.totalLpTokens); // Bonus for small pools
       const baseAPR = Math.min(0.5, 0.25 * poolSizeMultiplier); // 25-50% APR
       const baseRewardRate = baseAPR / (365 * 24); // Convert to hourly rate
       
       // Early adopter bonus (first 30 days)
       const poolAge = (Date.now() - pool.lastRewardTime) / (1000 * 60 * 60 * 24);
       const earlyAdopterBonus = poolAge < 30 ? 1.5 : 1.0;
       
       const newRewards = userPoolShare * pool.nilkReserve * baseRewardRate * hoursElapsed * earlyAdopterBonus;
       
       return newRewards;
     },

     claimLiquidityRewards: () => {
       const state = get();
       const newRewards = get().actions.calculateLiquidityRewards();
       
       if (newRewards > 0) {
         set((prevState) => ({
           userNilkBalance: prevState.userNilkBalance + newRewards,
           liquidityPools: {
             nilkHype: {
               ...prevState.liquidityPools.nilkHype,
               rewardsAccumulated: 0,
               lastRewardTime: Date.now(),
             },
           },
         }));
         
         console.log(`[claimLiquidityRewards] Claimed ${newRewards.toFixed(2)} NILK rewards`);
       }
       
       return newRewards;
     },

     // Profile Actions
     updateProfile: (profileData: { username?: string; avatarUrl?: string; xHandle?: string }) => {
       set((state) => ({
         userProfile: {
           ...state.userProfile,
           ...profileData,
         },
       }));
       
       // Also sync to Supabase if we have a wallet address
       if (typeof window !== 'undefined') {
         import('./supabase-sync').then(({ saveProfileToSupabase }) => {
           // Get wallet address from wagmi or localStorage
           const walletAddress = localStorage.getItem('wagmi.wallet') || 
                                localStorage.getItem('walletAddress');
           if (walletAddress) {
             saveProfileToSupabase(walletAddress, profileData).catch(error => {
               console.error('[Profile Update] Failed to sync to Supabase:', error);
             });
           }
         }).catch(error => {
           console.error('[Profile Update] Failed to import supabase-sync:', error);
         });
       }
     },

     setProfileComplete: (isComplete: boolean) => {
       set((state) => ({
         userProfile: {
           ...state.userProfile,
           isProfileComplete: isComplete,
         },
       }));
     },

     // Dynamic Pricing Actions
     updateHYPEPrice: (price: number) => {
       set((state) => ({
         dynamicPricing: {
           ...state.dynamicPricing,
           hyePrice: price,
           lastPriceUpdate: Date.now(),
         },
       }));
     },

     calculateDynamicHYPEPrice: (nilkAmount: number) => {
       const state = get();
       const nilkUSDValue = nilkAmount * state.dynamicPricing.estimatedNilkUSD;
       return Number((nilkUSDValue / state.dynamicPricing.hyePrice).toFixed(3));
     },

     updateNilkUSDEstimate: (usdValue: number) => {
       set((state) => ({
         dynamicPricing: {
           ...state.dynamicPricing,
           estimatedNilkUSD: usdValue,
         },
       }));
     },
  }
}),
{
  name: 'nilk-game-storage', // name of the item in the storage (must be unique)
  storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
     partialize: (state) =>
     Object.fromEntries(
       Object.entries(state).filter(([key]) => !['actions', 'autoSaveIntervalId', 'accumulationIntervalId'].includes(key))
     ),
}
)
);

export const useGameActions = () => useGameStore((state) => state.actions);

// You might want to add selectors for derived data, e.g.:
// export const selectTotalRawNilkProductionPerDay = (state: GameState) => 
//   state.ownedCows.reduce((total, cow) => total + cow.currentRawNilkPerDay, 0);

export default useGameStore; 