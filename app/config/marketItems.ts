import { COW_STATS, FLASK_STATS } from "../store/useGameStore";
import type { CowTier } from "../store/useGameStore";

// Define UpgradeItem interface earlier
export interface BulkDeal {
  quantity: number;
  totalPrice: number;
  discountDisplayName?: string; // e.g., "10% Off!", "Save 500 $NILK"
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  image: string;
  cost?: number; // Optional: for $NILK based items
  costRawNilk?: number; // Optional: for Raw Nilk based items
  tier?: CowTier;
  currency?: '$NILK' | 'Raw Nilk';
  category: 'cows' | 'machines' | 'flasks' | 'boosters'; // Updated categories
  stats?: Record<string, string | number>; // For displaying more info
  bulkDeals?: BulkDeal[];
  isUniquePurchase?: boolean; 
}

// Sample Market Items - This would ideally come from a config or store
export const initialMarketItems: UpgradeItem[] = [
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
    cost: 10000, // This should ideally come from MACHINES constant in store
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
    cost: 35000, // This should ideally come from MACHINES constant in store
    currency: '$NILK',
    category: 'machines',
    stats: { 'Conversion Rate': '45%', 'Processing Fee': '4%', 'Speed': 'Fast' },
    isUniquePurchase: false,
  },
  {
    id: 'YIELD_BOOST',
    name: FLASK_STATS.YIELD_BOOST.name,
    description: FLASK_STATS.YIELD_BOOST.description,
    image: FLASK_STATS.YIELD_BOOST.image,
    cost: FLASK_STATS.YIELD_BOOST.costNilk,
    costRawNilk: FLASK_STATS.YIELD_BOOST.costRawNilk,
    currency: 'Raw Nilk',
    category: 'flasks',
    stats: { 'Effect': FLASK_STATS.YIELD_BOOST.effectDescription, 'Duration': `${FLASK_STATS.YIELD_BOOST.durationHours} hours` },
    isUniquePurchase: false,
  },
  {
    id: 'FUSION_FLUX',
    name: FLASK_STATS.FUSION_FLUX.name,
    description: FLASK_STATS.FUSION_FLUX.description,
    image: FLASK_STATS.FUSION_FLUX.image,
    cost: FLASK_STATS.FUSION_FLUX.costNilk,
    costRawNilk: FLASK_STATS.FUSION_FLUX.costRawNilk,
    currency: 'Raw Nilk',
    category: 'flasks',
    stats: { 'Effect': FLASK_STATS.FUSION_FLUX.effectDescription, 'Duration': `${FLASK_STATS.FUSION_FLUX.durationHours} hours` },
    isUniquePurchase: false,
  },
  {
    id: 'CHRONO_CONDENSATE',
    name: FLASK_STATS.CHRONO_CONDENSATE.name,
    description: FLASK_STATS.CHRONO_CONDENSATE.description,
    image: FLASK_STATS.CHRONO_CONDENSATE.image,
    cost: FLASK_STATS.CHRONO_CONDENSATE.costNilk,
    costRawNilk: FLASK_STATS.CHRONO_CONDENSATE.costRawNilk,
    currency: 'Raw Nilk',
    category: 'flasks',
    stats: { 'Effect': FLASK_STATS.CHRONO_CONDENSATE.effectDescription, 'Duration': `${FLASK_STATS.CHRONO_CONDENSATE.durationHours} hours` },
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
]; 