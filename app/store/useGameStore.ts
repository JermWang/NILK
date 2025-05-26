import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

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
    costNilk: 10000,     // Beta: 10000
    costHype: 5,
    costUsdc: 5,
    imageUrl: '/nilk machine.png',
    description: 'A reliable machine for converting Raw Nilk to $NILK.'
  },
  pro: {
    id: 'pro',
    name: 'Pro Nilk Machine',
    conversionRate: 0.45, // Beta: 0.45
    feePercentage: 4,    // Beta: 4
    costNilk: 35000,     // Beta: 35000
    fusionCostNilk: 5000, // Beta: 5000 (Pro Machine Fusion Fee)
    costHype: 20,
    costUsdc: 20,
    imageUrl: '/nilk machine PRO.png',
    description: 'Top-tier efficiency and lower fees for serious Nilk producers.'
  }
};

export const MANUAL_PROCESSING_STATS: Omit<Machine, 'id' | 'name' | 'costNilk' | 'costHype' | 'costUsdc' | 'imageUrl' | 'description' | 'fusionCostNilk'> & { name: string, description: string, id: 'manual' } = {
  id: 'manual',
  name: 'Manual Processing',
  conversionRate: 0.25, // Beta: 0.25
  feePercentage: 12,   // Beta: 12
  description: 'Basic, less efficient processing without a machine.'
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
    rawNilkPerDayBase: 1000, // TOKENOMICS.md: 1000 Raw Nilk/day
    evolutionBaseCost: 1500, // TOKENOMICS.md: Level 1 cost 1.5k, +1.5k per level
    evolutionLevelMultiplier: 1500, // TOKENOMICS.md: Increment
    directPurchaseCost: 13000, // TOKENOMICS.md: 13k $NILK
    imageUrl: "/NILK COW.png",
    modelPath: "/MODELS/COW.glb",
    description: "A humble beginning to your Nilk empire."
  },
  cosmic: {
    name: "Cosmic Cow",
    rawNilkPerDayBase: 5000, // TOKENOMICS.md: 5000 Raw Nilk/day
    evolutionBaseCost: 7500, // TOKENOMICS.md: Level 1 cost 7.5k, +7.5k per level
    evolutionLevelMultiplier: 7500, // TOKENOMICS.md: Increment
    directPurchaseCost: 41000, // Derived: (2 * 13k Common) + 15k Fusion Fee
    imageUrl: "/cosmic cow.png",
    modelPath: "/MODELS/COW_COSMIC.glb",
    inputsForFusion: { tierInput: 'common', count: 2 },
    fusionFee: 15000, // TOKENOMICS.md: 15k $NILK
    description: "A stellar producer of Raw Nilk."
  },
  galactic_moo_moo: {
    name: "Galactic Moo Moo",
    rawNilkPerDayBase: 25000, // TOKENOMICS.md: 25000 Raw Nilk/day
    evolutionBaseCost: 30000, // TOKENOMICS.md: Level 1 cost 30k, +30k per level
    evolutionLevelMultiplier: 30000, // TOKENOMICS.md: Increment
    directPurchaseCost: 239000, // Derived: (4 * 41k Cosmic) + 75k Fusion Fee
    imageUrl: "/galactic moo moo.png",
    modelPath: "/MODELS/COW_GALACTIC.glb",
    inputsForFusion: { tierInput: 'cosmic', count: 4 },
    fusionFee: 75000, // TOKENOMICS.md: 75k $NILK
    description: "The ultimate legend in Nilk production."
  },
  // Potentially add more tiers here if needed in the future
  // legendary_lactator: { ... }
};

const MAX_COW_LEVEL = 10;
const YIELD_BOOSTER_MAX_LEVEL = 10; // Define max level for yield booster
// --- End Cow Definitions ---

interface GameState {
  userNilkBalance: number;
  userRawNilkBalance: number;
  treasuryBalance: number;
  ownedMachines: Record<Exclude<MachineType, 'manual'>, number>;
  ownedCows: Cow[];
  yieldBoosterLevel: number;
  nextCowId: number; // Simple counter for unique cow IDs
  lastGlobalHarvestTime: number; // Timestamp of the last global harvest all
  hasManualProcessor: boolean; // New state for manual processor ownership
  hasMoofiBadge: boolean;    // New state for MOOFI badge ownership
}

export interface GameActions {
  increaseNilkBalance: (amount: number) => void;
  decreaseNilkBalance: (amount: number) => void;
  setNilkBalance: (amount: number) => void;
  increaseRawNilkBalance: (amount: number) => void;
  decreaseRawNilkBalance: (amount: number) => void;
  setRawNilkBalance: (amount: number) => void;
  increaseTreasuryBalance: (amount: number) => void;
  addOwnedMachine: (machineId: Exclude<MachineType, 'manual'>) => void;
  performMachineFusion: () => void;
  
  // Cow Actions
  purchaseCow: (tier: CowTier) => boolean; // Returns success
  evolveCow: (cowId: string) => boolean; // Returns success
  fuseCows: (inputCowIds: string[], outputTier: CowTier) => boolean; // Returns success
  harvestRawNilkFromCow: (cowId: string) => void;
  harvestAllRawNilk: () => void;
  updateCowProductionRates: () => void; // Recalculates currentRawNilkPerDay for all cows

  // Farm Upgrades
  upgradeYieldBooster: () => boolean; // Returns success
  purchaseManualProcessor: () => boolean; // New action
  purchaseMoofiBadge: () => boolean;    // New action
  processRawNilk: (amountToConvert: number) => boolean; // New action
}

interface GameStore extends GameState {
  actions: GameActions;
}

// Helper function to calculate production
const calculateCowProduction = (cow: Cow, yieldBoosterLevel: number): number => {
  let production = COW_STATS[cow.tier].rawNilkPerDayBase;
  // Apply evolution bonus (15% per level, compounding)
  for (let i = 0; i < cow.level; i++) {
    production *= 1.15;
  }
  // Apply Yield Booster bonus (10% per level, compounding)
  for (let i = 0; i < yieldBoosterLevel; i++) {
    production *= 1.10;
  }
  return parseFloat(production.toFixed(2)); // Keep it to 2 decimal places
};

const useGameStore = create<GameStore>((set, get) => ({
  userNilkBalance: 100000, // Initial mocked Nilk balance for beta
  userRawNilkBalance: 0,
  treasuryBalance: 0,
  ownedMachines: { standard: 0, pro: 0 },
  ownedCows: [],
  yieldBoosterLevel: 0,
  nextCowId: 1,
  lastGlobalHarvestTime: 0,
  hasManualProcessor: false,
  hasMoofiBadge: false,

  actions: {
    increaseNilkBalance: (amount) => set((state) => ({ userNilkBalance: state.userNilkBalance + amount })),
    decreaseNilkBalance: (amount) => set((state) => ({ userNilkBalance: Math.max(0, state.userNilkBalance - amount) })),
    setNilkBalance: (amount) => set({ userNilkBalance: amount }),
    increaseRawNilkBalance: (amount) => set((state) => ({ userRawNilkBalance: state.userRawNilkBalance + amount })),
    decreaseRawNilkBalance: (amount) => set((state) => ({ userRawNilkBalance: Math.max(0, state.userRawNilkBalance - amount) })),
    setRawNilkBalance: (amount) => set({ userRawNilkBalance: amount }),
    increaseTreasuryBalance: (amount) => set((state) => ({ treasuryBalance: state.treasuryBalance + amount })),
    
    addOwnedMachine: (machineId) => { // This is for direct purchase, cost handled in UI
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
      if (fusionCost === undefined) { // Should always be defined for pro
          console.error("Pro machine fusion cost is not defined");
          return; 
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
      }
    },

    updateCowProductionRates: () => {
      set(state => {
        let hasChanged = false;
        const newOwnedCows = state.ownedCows.map(cow => {
          const newProductionRate = calculateCowProduction(cow, state.yieldBoosterLevel);
          if (newProductionRate !== cow.currentRawNilkPerDay) {
            hasChanged = true;
            return { ...cow, currentRawNilkPerDay: newProductionRate };
          }
          return cow;
        });

        if (hasChanged) {
          return { ...state, ownedCows: newOwnedCows };
        }
        return state; // No change, return current state to avoid unnecessary re-render
      });
    },

    purchaseCow: (tier: CowTier) => {
      const state = get();
      const cowStat = COW_STATS[tier];
      const cost = cowStat.directPurchaseCost;

      if (state.userNilkBalance >= cost) {
        const newCow: Cow = {
          id: 'cow_' + state.nextCowId,
          tier: tier,
          name: cowStat.name,
          rawNilkPerDayBase: cowStat.rawNilkPerDayBase,
          level: 0, 
          currentRawNilkPerDay: 0, // Will be set by updateCowProductionRates
          accumulatedRawNilk: 0,
          lastHarvestTime: Date.now(),
          imageUrl: cowStat.imageUrl,
        };
        // Add the cow first, then update all rates.
        // The update will correctly calculate for the new cow as well.
        set({
          userNilkBalance: state.userNilkBalance - cost,
          treasuryBalance: state.treasuryBalance + cost,
          ownedCows: [...state.ownedCows, newCow],
          nextCowId: state.nextCowId + 1,
        });
        get().actions.updateCowProductionRates(); 
        return true;
      }
      return false;
    },

    evolveCow: (cowId: string) => {
      const state = get();
      const cowIndex = state.ownedCows.findIndex(c => c.id === cowId);
      if (cowIndex === -1) return false;

      const cow = state.ownedCows[cowIndex];
      if (cow.level >= MAX_COW_LEVEL) return false;

      const cowStat = COW_STATS[cow.tier];
      const cost = cowStat.evolutionBaseCost + (cow.level * cowStat.evolutionLevelMultiplier);

      if (state.userNilkBalance >= cost) {
        const newOwnedCows = [...state.ownedCows];
        newOwnedCows[cowIndex] = {
          ...cow,
          level: cow.level + 1,
          // currentRawNilkPerDay will be updated by the subsequent call
        };

        set({
          userNilkBalance: state.userNilkBalance - cost,
          treasuryBalance: state.treasuryBalance + cost,
          ownedCows: newOwnedCows, 
        });
        get().actions.updateCowProductionRates();
        return true;
      }
      return false;
    },
    
    fuseCows: (inputCowIds: string[], outputTier: CowTier) => {
      const state = get();
      const outputCowStat = COW_STATS[outputTier];
      if (!outputCowStat.inputsForFusion || typeof outputCowStat.fusionFee !== 'number') {
        console.error(`[Fuse Error] Fusion configuration for ${outputTier} is incomplete.`);
        return false;
      }

      const { tierInput, count: inputCount } = outputCowStat.inputsForFusion;
      const fusionFee = outputCowStat.fusionFee;

      const inputCows = state.ownedCows.filter(c => inputCowIds.includes(c.id) && c.tier === tierInput);
      if (inputCows.length !== inputCount) {
        console.error(`[Fuse Error] Incorrect input cows. Need ${inputCount} of tier ${tierInput}. Got ${inputCows.length}`);
        return false;
      }

      if (state.userNilkBalance >= fusionFee) {
        const remainingCows = state.ownedCows.filter(c => !inputCowIds.includes(c.id));
        const newFusedCow: Cow = {
          id: 'cow_' + state.nextCowId,
          tier: outputTier,
          name: outputCowStat.name,
          rawNilkPerDayBase: outputCowStat.rawNilkPerDayBase,
          level: 0, 
          currentRawNilkPerDay: 0, // Will be set by updateCowProductionRates
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
        get().actions.updateCowProductionRates();
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
            if (hoursSinceLastHarvest >= 1) { 
                 amountToHarvest = cow.currentRawNilkPerDay * Math.min(hoursSinceLastHarvest / 24, 1); 
            }
        }
        amountToHarvest = parseFloat(amountToHarvest.toFixed(2));


        if (amountToHarvest <= 0) return state;

        const newOwnedCows = [...state.ownedCows];
        newOwnedCows[cowIndex] = {
          ...cow,
          accumulatedRawNilk: 0, 
          lastHarvestTime: Date.now(), 
        };

        return {
          ...state,
          userRawNilkBalance: state.userRawNilkBalance + amountToHarvest,
          ownedCows: newOwnedCows,
        };
      });
    },

    harvestAllRawNilk: () => {
      set(state => {
        let totalHarvested = 0;
        let cowsChanged = false;
        const updatedCows = state.ownedCows.map(cow => {
            let amountToHarvest = cow.accumulatedRawNilk;
            if (amountToHarvest === 0 && cow.currentRawNilkPerDay > 0) {
                const hoursSinceLastHarvest = (Date.now() - cow.lastHarvestTime) / (1000 * 60 * 60);
                 if (hoursSinceLastHarvest >= 1) { 
                    amountToHarvest = cow.currentRawNilkPerDay * Math.min(hoursSinceLastHarvest / 24, 1); 
                }
            }
            amountToHarvest = parseFloat(amountToHarvest.toFixed(2));

            if (amountToHarvest > 0) {
                totalHarvested += amountToHarvest;
                cowsChanged = true;
                return { ...cow, accumulatedRawNilk: 0, lastHarvestTime: Date.now() };
            }
            return cow;
        });

        if (cowsChanged) { // Only update if any cow was actually harvested
          return {
            ...state,
            userRawNilkBalance: state.userRawNilkBalance + totalHarvested,
            ownedCows: updatedCows,
          };
        }
        return state;
      });
    },
    
    _simulateAccumulation: (deltaTimeSeconds: number) => {
        set(state => {
            let hasAnyCowAccumulated = false;
            const newOwnedCows = state.ownedCows.map(cow => {
                const productionPerSecond = cow.currentRawNilkPerDay / (24 * 60 * 60);
                if (productionPerSecond === 0 && cow.accumulatedRawNilk === 0) return cow; // No production, no accumulation, no change

                let newAccumulation = cow.accumulatedRawNilk + (productionPerSecond * deltaTimeSeconds);
                newAccumulation = parseFloat(newAccumulation.toFixed(4))
                
                if (newAccumulation !== cow.accumulatedRawNilk) {
                    hasAnyCowAccumulated = true;
                    return { ...cow, accumulatedRawNilk: newAccumulation };
                }
                return cow;
            });
            if(hasAnyCowAccumulated){
                return {...state, ownedCows: newOwnedCows };
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

    purchaseManualProcessor: () => {
      const { userRawNilkBalance, hasManualProcessor } = get();
      const cost = 500; // Defined in app/page.tsx as well, keep consistent or move to COW_STATS/MACHINES
      if (hasManualProcessor) {
        console.log("[Store] Manual Processor already owned.");
        return false; // Or true if we want to allow "buying" again without effect
      }
      if (userRawNilkBalance >= cost) {
        set((state) => ({
          userRawNilkBalance: state.userRawNilkBalance - cost,
          hasManualProcessor: true,
        }));
        console.log("[Store] Manual Processor purchased successfully.");
        return true;
      }
      console.log("[Store] Insufficient Raw Nilk to purchase Manual Processor.");
      return false;
    },

    purchaseMoofiBadge: () => {
      const { userNilkBalance, hasMoofiBadge } = get();
      const cost = 1000000; // Defined in app/page.tsx, keep consistent
      if (hasMoofiBadge) {
        console.log("[Store] MOOFI Badge already owned.");
        return false;
      }
      if (userNilkBalance >= cost) {
        set((state) => ({
          userNilkBalance: state.userNilkBalance - cost,
          hasMoofiBadge: true,
        }));
        console.log("[Store] MOOFI Badge purchased successfully.");
        return true;
      }
      console.log("[Store] Insufficient $NILK to purchase MOOFI Badge.");
      return false;
    },

    processRawNilk: (amountToConvert: number) => {
      const { userRawNilkBalance, hasManualProcessor, hasMoofiBadge } = get();
      if (!hasManualProcessor) {
        console.error("[Store] Manual Processor not owned. Cannot process Raw Nilk.");
        return false;
      }
      if (amountToConvert <= 0) {
        console.error("[Store] Amount to convert must be positive.");
        return false;
      }
      if (userRawNilkBalance < amountToConvert) {
        console.error("[Store] Insufficient Raw Nilk to process.");
        return false;
      }

      const baseConversionRate = 0.1; // 10 Raw Nilk -> 1 $NILK
      const moofiBadgeBonus = 0.05; // 5% bonus
      let actualConversionRate = baseConversionRate;

      if (hasMoofiBadge) {
        actualConversionRate = baseConversionRate * (1 + moofiBadgeBonus); // 0.1 * 1.05 = 0.105
      }

      const nilkYield = amountToConvert * actualConversionRate;

      set((state) => ({
        userRawNilkBalance: state.userRawNilkBalance - amountToConvert,
        userNilkBalance: state.userNilkBalance + nilkYield,
      }));

      console.log(`[Store] Processed ${amountToConvert} Raw Nilk into ${nilkYield.toFixed(2)} $NILK.`);
      return true;
    },
  }
}));

export const useGameActions = () => useGameStore((state) => state.actions);

// You might want to add selectors for derived data, e.g.:
// export const selectTotalRawNilkProductionPerDay = (state: GameState) => 
//   state.ownedCows.reduce((total, cow) => total + cow.currentRawNilkPerDay, 0);

export default useGameStore; 