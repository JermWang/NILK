'use client';

import React, { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { ArrowLeftRight, Plus, Minus, TrendingUp, Coins, Zap } from 'lucide-react';
import Image from 'next/image';

export default function LiquidityPage() {
  const gameState = useGameStore();
  const { actions } = gameState;
  const pool = gameState.liquidityPools.nilkHype;
  
  const [nilkAmount, setNilkAmount] = useState<string>('');
  const [hypeAmount, setHypeAmount] = useState<string>('');
  const [lpTokensToRemove, setLpTokensToRemove] = useState<string>('');
  
  // Calculate current pool ratio
  const currentRatio = pool.nilkReserve > 0 ? pool.nilkReserve / pool.hypeReserve : 500;
  const pendingRewards = actions.calculateLiquidityRewards();
  
  // Auto-calculate paired amounts based on pool ratio
  const handleNilkChange = (value: string) => {
    setNilkAmount(value);
    if (value && !isNaN(Number(value))) {
      const calculatedHype = Number(value) / currentRatio;
      setHypeAmount(calculatedHype.toFixed(4));
    } else {
      setHypeAmount('');
    }
  };
  
  const handleHypeChange = (value: string) => {
    setHypeAmount(value);
    if (value && !isNaN(Number(value))) {
      const calculatedNilk = Number(value) * currentRatio;
      setNilkAmount(calculatedNilk.toFixed(2));
    } else {
      setNilkAmount('');
    }
  };
  
  const handleAddLiquidity = () => {
    const nilk = Number(nilkAmount);
    const hype = Number(hypeAmount);
    
    if (nilk > 0 && hype > 0) {
      const success = actions.addLiquidity(nilk, hype);
      if (success) {
        setNilkAmount('');
        setHypeAmount('');
      }
    }
  };
  
  const handleRemoveLiquidity = () => {
    const lpTokens = Number(lpTokensToRemove);
    if (lpTokens > 0) {
      const success = actions.removeLiquidity(lpTokens);
      if (success) {
        setLpTokensToRemove('');
      }
    }
  };
  
  const handleClaimRewards = () => {
    const claimed = actions.claimLiquidityRewards();
    if (claimed > 0) {
      console.log(`Claimed ${claimed.toFixed(2)} NILK rewards`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black pt-48 pb-4 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 12rem)' }}>
        {/* Compact Header */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-white mb-1">
            NILK/HYPE Liquidity Pool
          </h1>
          <p className="text-gray-400 text-xs">
            Provide liquidity and earn rewards on Hyperliquid
          </p>
        </div>

        {/* Main Content Grid - Compact Layout */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-3">
          
          {/* Left Column: Pool Stats & Your Position */}
          <div className="space-y-3">
            {/* Pool Stats - Compact */}
            <div className="bg-black/70 backdrop-blur-md rounded-xl border border-lime-400/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-lime-400" />
                  Pool Stats
                </h2>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Total NILK</span>
                  <div className="flex items-center gap-1">
                    <Image src="/nilk token.png" alt="NILK" width={16} height={16} />
                    <span className="text-white font-bold text-sm">{pool.nilkReserve.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Total HYPE</span>
                  <div className="flex items-center gap-1">
                    <Image src="/hyperliquid.png" alt="HYPE" width={16} height={16} />
                    <span className="text-white font-bold text-sm">{pool.hypeReserve.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Ratio</span>
                  <span className="text-lime-400 font-bold text-sm">1 HYPE = {currentRatio.toFixed(0)} NILK</span>
                </div>
              </div>
            </div>

            {/* Your Position - Compact */}
            <div className="bg-black/70 backdrop-blur-md rounded-xl border border-purple-400/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  Your Position
                </h2>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">LP Tokens</span>
                  <span className="text-white font-bold text-sm">{pool.userLpTokens.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Pool Share</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {pool.totalLpTokens > 0 ? ((pool.userLpTokens / pool.totalLpTokens) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Rewards</span>
                  <div className="flex items-center gap-1">
                    <Image src="/nilk token.png" alt="NILK" width={16} height={16} />
                    <span className="text-lime-400 font-bold text-sm">{pendingRewards.toFixed(4)}</span>
                  </div>
                </div>
                
                {pendingRewards > 0 && (
                  <button
                    onClick={handleClaimRewards}
                    className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Claim Rewards
                  </button>
                )}
              </div>
            </div>

            {/* Your Balances - Compact */}
            <div className="bg-black/70 backdrop-blur-md rounded-xl border border-gray-400/40 p-3">
              <h2 className="text-base font-bold text-white mb-2">Your Balances</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Image src="/nilk token.png" alt="NILK" width={20} height={20} />
                    <span className="text-white font-semibold text-sm">NILK</span>
                  </div>
                  <span className="text-white font-bold text-sm">{gameState.userNilkBalance.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Image src="/hyperliquid.png" alt="HYPE" width={20} height={20} />
                    <span className="text-white font-semibold text-sm">HYPE</span>
                  </div>
                  <span className="text-white font-bold text-sm">{gameState.userHypeBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Add Liquidity */}
          <div className="bg-black/70 backdrop-blur-md rounded-xl border border-blue-400/40 p-3 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add Liquidity
              </h2>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-gray-300 mb-1 text-xs">NILK Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={nilkAmount}
                    onChange={(e) => handleNilkChange(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Image src="/nilk token.png" alt="NILK" width={16} height={16} />
                    <span className="text-gray-400 text-xs">NILK</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 mt-1">
                  Balance: {gameState.userNilkBalance.toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-center">
                <ArrowLeftRight className="w-5 h-5 text-gray-400" />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1 text-xs">HYPE Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={hypeAmount}
                    onChange={(e) => handleHypeChange(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none text-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Image src="/hyperliquid.png" alt="HYPE" width={16} height={16} />
                    <span className="text-gray-400 text-xs">HYPE</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 mt-1">
                  Balance: {gameState.userHypeBalance.toLocaleString()}
                </div>
              </div>
              
              <button
                onClick={handleAddLiquidity}
                disabled={!nilkAmount || !hypeAmount || Number(nilkAmount) > gameState.userNilkBalance || Number(hypeAmount) > gameState.userHypeBalance}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Liquidity
              </button>
            </div>
          </div>

          {/* Right Column: Remove Liquidity */}
          <div className="bg-black/70 backdrop-blur-md rounded-xl border border-red-400/40 p-3 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-400" />
                Remove Liquidity
              </h2>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-gray-300 mb-1 text-xs">LP Tokens to Remove</label>
                <input
                  type="number"
                  value={lpTokensToRemove}
                  onChange={(e) => setLpTokensToRemove(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-red-400 focus:outline-none text-sm"
                  placeholder="0.00"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  Available: {pool.userLpTokens.toFixed(2)}
                </div>
              </div>
              
              {lpTokensToRemove && Number(lpTokensToRemove) > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="text-xs text-gray-300 mb-2">You will receive:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Image src="/nilk token.png" alt="NILK" width={14} height={14} />
                        <span className="text-white text-xs">NILK</span>
                      </div>
                      <span className="text-white font-bold text-xs">
                        {((Number(lpTokensToRemove) / pool.totalLpTokens) * pool.nilkReserve).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Image src="/hyperliquid.png" alt="HYPE" width={14} height={14} />
                        <span className="text-white text-xs">HYPE</span>
                      </div>
                      <span className="text-white font-bold text-xs">
                        {((Number(lpTokensToRemove) / pool.totalLpTokens) * pool.hypeReserve).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleRemoveLiquidity}
                disabled={!lpTokensToRemove || Number(lpTokensToRemove) > pool.userLpTokens}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <Minus className="w-4 h-4" />
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 