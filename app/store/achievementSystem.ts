import { GameState } from './useGameStore';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'farming' | 'processing' | 'collection' | 'economic' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'cow_count' | 'nilk_balance' | 'raw_nilk_processed' | 'harvest_count' | 'fusion_count' | 'machine_count' | 'custom';
    target: number;
    tier?: string;
  };
  reward: {
    type: 'nilk' | 'raw_nilk' | 'title' | 'badge';
    amount?: number;
    title?: string;
  };
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Farming Achievements
  {
    id: 'first_cow',
    name: 'Moo-nificent Beginning',
    description: 'Purchase your first cow',
    icon: '🐄',
    category: 'farming',
    rarity: 'common',
    requirements: { type: 'cow_count', target: 1 },
    reward: { type: 'nilk', amount: 1000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'cow_collector',
    name: 'Herd Master',
    description: 'Own 10 cows',
    icon: '🐮',
    category: 'farming',
    rarity: 'rare',
    requirements: { type: 'cow_count', target: 10 },
    reward: { type: 'nilk', amount: 10000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'cosmic_collector',
    name: 'Cosmic Rancher',
    description: 'Own 5 Cosmic Cows',
    icon: '🌌',
    category: 'farming',
    rarity: 'epic',
    requirements: { type: 'cow_count', target: 5, tier: 'cosmic' },
    reward: { type: 'nilk', amount: 25000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'galactic_master',
    name: 'Galactic Overlord',
    description: 'Own a Galactic Moo Moo',
    icon: '🌟',
    category: 'farming',
    rarity: 'legendary',
    requirements: { type: 'cow_count', target: 1, tier: 'galactic_moo_moo' },
    reward: { type: 'title', title: 'Galactic Overlord' },
    unlocked: false,
    progress: 0,
  },

  // Economic Achievements
  {
    id: 'nilk_millionaire',
    name: 'NILK Millionaire',
    description: 'Accumulate 1,000,000 $NILK',
    icon: '💰',
    category: 'economic',
    rarity: 'epic',
    requirements: { type: 'nilk_balance', target: 1000000 },
    reward: { type: 'badge', title: 'Millionaire Badge' },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'processing_master',
    name: 'Processing Virtuoso',
    description: 'Process 100,000 Raw Nilk',
    icon: '⚙️',
    category: 'processing',
    rarity: 'rare',
    requirements: { type: 'raw_nilk_processed', target: 100000 },
    reward: { type: 'nilk', amount: 15000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'fusion_expert',
    name: 'Fusion Expert',
    description: 'Perform 10 cow fusions',
    icon: '🔬',
    category: 'collection',
    rarity: 'rare',
    requirements: { type: 'fusion_count', target: 10 },
    reward: { type: 'nilk', amount: 20000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'machine_mogul',
    name: 'Machine Mogul',
    description: 'Own 5 Pro Machines',
    icon: '🏭',
    category: 'processing',
    rarity: 'epic',
    requirements: { type: 'machine_count', target: 5, tier: 'pro' },
    reward: { type: 'nilk', amount: 50000 },
    unlocked: false,
    progress: 0,
  },

  // Special Achievements
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join the NILK ecosystem in its early days',
    icon: '🚀',
    category: 'special',
    rarity: 'legendary',
    requirements: { type: 'custom', target: 1 },
    reward: { type: 'title', title: 'Pioneer' },
    unlocked: false,
    progress: 0,
  },
];

export class AchievementManager {
  private achievements: Achievement[] = [...ACHIEVEMENTS];
  private listeners: ((achievement: Achievement) => void)[] = [];

  constructor() {
    // Only load progress on client side
    if (typeof window !== 'undefined') {
      this.loadProgress();
    }
  }

  private loadProgress() {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const saved = localStorage.getItem('nilk-achievements');
      if (saved) {
        const savedAchievements = JSON.parse(saved);
        this.achievements = this.achievements.map(achievement => {
          const saved = savedAchievements.find((s: Achievement) => s.id === achievement.id);
          return saved ? { ...achievement, ...saved } : achievement;
        });
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }
  }

  private saveProgress() {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      localStorage.setItem('nilk-achievements', JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  public checkAchievements(gameState: GameState): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      const progress = this.calculateProgress(achievement, gameState);
      achievement.progress = progress;

      if (progress >= achievement.requirements.target) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        newlyUnlocked.push(achievement);
        
        // Apply reward
        this.applyReward(achievement, gameState);
        
        // Notify listeners
        this.listeners.forEach(listener => listener(achievement));
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveProgress();
    }

    return newlyUnlocked;
  }

  private calculateProgress(achievement: Achievement, gameState: GameState): number {
    const { type, tier } = achievement.requirements;

    switch (type) {
      case 'cow_count':
        if (tier) {
          return gameState.ownedCows.filter(cow => cow.tier === tier).length;
        }
        return gameState.ownedCows.length;

      case 'nilk_balance':
        return gameState.userNilkBalance;

      case 'machine_count':
        if (tier === 'pro') {
          return gameState.ownedMachines.pro;
        } else if (tier === 'standard') {
          return gameState.ownedMachines.standard;
        }
        return gameState.ownedMachines.standard + gameState.ownedMachines.pro;

      case 'raw_nilk_processed':
        // This would need to be tracked separately in game state
        return 0; // Placeholder

      case 'harvest_count':
        // This would need to be tracked separately in game state
        return 0; // Placeholder

      case 'fusion_count':
        // This would need to be tracked separately in game state
        return 0; // Placeholder

      case 'custom':
        // Handle special achievements
        if (achievement.id === 'early_adopter') {
          // Check if user joined before a certain date
          return 1; // Placeholder - would check actual join date
        }
        return 0;

      default:
        return 0;
    }
  }

  private applyReward(achievement: Achievement, gameState: GameState) {
    const { reward } = achievement;
    
    // Note: In a real implementation, these rewards would be applied through the game store
    console.log(`Achievement unlocked: ${achievement.name}`);
    console.log(`Reward: ${reward.type}`, reward.amount || reward.title);
    
    // This would integrate with the game store to actually apply rewards
    // For now, just log the reward
  }

  public onAchievementUnlocked(callback: (achievement: Achievement) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  public getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this.achievements.filter(a => a.category === category);
  }

  public getCompletionPercentage(): number {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    return Math.round((unlocked / this.achievements.length) * 100);
  }
}

// Singleton instance
export const achievementManager = new AchievementManager(); 