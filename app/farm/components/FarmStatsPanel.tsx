"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface FarmStatsPanelProps {
  yieldBoosterLevel: number;
  onUpgrade: () => void;
  calculateYieldBoosterCost: (level: number) => number;
}

const FarmStatsPanel: React.FC<FarmStatsPanelProps> = ({
  yieldBoosterLevel,
  onUpgrade,
  calculateYieldBoosterCost,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <Button 
        onClick={onUpgrade}
        className="w-full h-auto bg-slate-800 hover:bg-slate-700 border border-lime-700/50 p-3 flex items-center space-x-4"
      >
        <div className="bg-lime-900/50 p-2 rounded-lg">
          <Star className="h-8 w-8 text-lime-400" />
        </div>
        <div className="text-left">
          <p className="font-bold text-lg text-lime-400">Yield Booster</p>
          <p className="text-sm text-slate-400">Current Level: {yieldBoosterLevel}</p>
          <p className="text-sm text-slate-400">Next Upgrade Cost: {calculateYieldBoosterCost(yieldBoosterLevel)} $NILK</p>
        </div>
      </Button>
      {/* Add other buttons for MOOFI Badge, Alien Farmer, etc. here if needed */}
    </div>
  );
};

export default FarmStatsPanel; 