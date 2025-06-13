'use client';

import React, { useState } from 'react';
import { useEnhancedGameStore } from '../store/enhancedGameStore';
import { ArrowLeftRight, Plus, Minus, TrendingUp, Coins, Zap, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';

export default function EnhancedLiquidityPage() {
  const gameState = useEnhancedGameStore();
  const { actions } = gameState;
  const pool = gameState.liquidityPool;
  
  const [nilkAmount, setNilkAmount] = useState<string>('');
  const [hypeAmount, setHypeAmount] = useState<string>('');
  const [lpTokensToRemove, setLpTokensToRemove] = useState<string>('');
  const [swapFrom, setSwapFrom] = useState<'NILK' | 'HYPE'>('NILK');
  const [swapAmount, setSwapAmount] = useState<string>('');
  
  // Calculate current pool ratio and enhanced rewards
  const currentRatio = pool.nilkReserve > 0 ? pool.nilkReserve / pool.hypeReserve : 500;
  const pendingRewards = actions.calculateCurrentRewards();
  
  // Calculate current APR based on pool size
  const poolSizeMultiplier = Math.max(1, 100000 / pool.totalLpTokens);
  const currentAPR = Math.min(50, 25 * poolSizeMultiplier);
  
  const handleAddLiquidity = () => {
    const nilk = Number(nilkAmount);
    const hype = Number(hypeAmount);
    
    if (nilk > 0 && hype > 0) {
      const success = actions.addLiquidityEnhanced(nilk, hype);
      if (success) {
        setNilkAmount('');
        setHypeAmount('');
        // No HYPE rewards given anymore
      }
    }
  };
  
  const handleClaimRewards = () => {
    const claimed = actions.claimEnhancedRewards();
    if (claimed > 0) {
      console.log(`Claimed ${claimed.toFixed(2)} NILK rewards`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Enhanced NILK/HYPE Liquidity Pool
          </h1>
          <p className="text-gray-400">
            Earn up to {currentAPR.toFixed(0)}% APR with dynamic rewards
          </p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <div className="bg-green-900/30 px-4 py-2 rounded-lg border border-green-400/40">
              <span className="text-green-400 font-bold">25-50% APR</span>
            </div>
            <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-400/40">
              <span className="text-purple-400 font-bold">0.3% Trading Fees</span>
            </div>
            <div className="bg-yellow-900/30 px-4 py-2 rounded-lg border border-yellow-400/40">
              <span className="text-yellow-400 font-bold">1.5x Early Bonus</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl border-2 border-lime-400/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-lime-400" />
                Enhanced Pool Stats
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-300">Total NILK</span>
                <div className="flex items-center gap-2">
                  <Image src="/nilk token.png" alt="NILK" width={24} height={24} />
                  <span className="text-white font-bold">{pool.nilkReserve.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-300">Total HYPE</span>
                <div className="flex items-center gap-2">
                  <Image src="/hyperliquid.png" alt="HYPE" width={24} height={24} />
                  <span className="text-white font-bold">{pool.hypeReserve.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-300">Current APR</span>
                <span className="text-lime-400 font-bold">{currentAPR.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-300">Your LP Tokens</span>
                <span className="text-white font-bold">{pool.userLpTokens.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-300">Enhanced Rewards</span>
                <div className="flex items-center gap-2">
                  <Image src="/nilk token.png" alt="NILK" width={20} height={20} />
                  <span className="text-lime-400 font-bold">{pendingRewards.toFixed(4)}</span>
                </div>
              </div>
              
              {pendingRewards > 0 && (
                <button
                  onClick={handleClaimRewards}
                  className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Claim Enhanced Rewards
                </button>
              )}
            </div>
          </div>

          <div className="bg-black/70 backdrop-blur-md rounded-2xl border-2 border-blue-400/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-400" />
                Add Enhanced Liquidity
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">NILK Amount</label>
                <input
                  type="number"
                  value={nilkAmount}
                  onChange={(e) => setNilkAmount(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">HYPE Amount</label>
                <input
                  type="number"
                  value={hypeAmount}
                  onChange={(e) => setHypeAmount(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              
              <div className="bg-green-900/20 rounded-xl p-4">
                <div className="text-sm text-green-300 mb-2">Enhanced Rewards:</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current APR:</span>
                    <span className="text-green-400 font-bold">{currentAPR.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Early Bonus:</span>
                    <span className="text-yellow-400 font-bold">+50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Trading Fees:</span>
                    <span className="text-purple-400 font-bold">0.3%</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleAddLiquidity}
                disabled={!nilkAmount || !hypeAmount}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Enhanced Liquidity
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/70 backdrop-blur-md rounded-2xl border-2 border-gray-400/40 p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Enhanced Marketplace (25% HYPE Discount)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameState.enhancedMarketItems.map((item) => (
              <div key={item.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                <div className="w-16 h-16 relative mx-auto mb-3">
                  <Image src={item.image} alt={item.name} fill className="object-contain" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2 text-center">{item.name}</h3>
                <div className="space-y-1">
                  {item.pricing.nilk && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">NILK:</span>
                      <span className="text-yellow-400">{item.pricing.nilk.toLocaleString()}</span>
                    </div>
                  )}
                  {item.pricing.hype && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">HYPE:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-purple-400">{item.pricing.hype}</span>
                        <span className="text-green-400 text-xs">(-25%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/70 backdrop-blur-md rounded-2xl border-2 border-gray-400/40 p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Enhanced Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Image src="/nilk token.png" alt="NILK" width={32} height={32} />
                <span className="text-white font-semibold">NILK</span>
              </div>
              <span className="text-white font-bold text-lg">{gameState.userNilkBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Image src="/hyperliquid.png" alt="HYPE" width={32} height={32} />
                <span className="text-white font-semibold">HYPE</span>
              </div>
              <span className="text-white font-bold text-lg">{gameState.userHypeBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Image src="/smalljar.png" alt="Raw Nilk" width={32} height={32} />
                <span className="text-white font-semibold">Raw Nilk</span>
              </div>
              <span className="text-white font-bold text-lg">{gameState.userRawNilkBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
