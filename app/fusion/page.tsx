"use client";

import React from "react";
// import Link from "next/link"; // Temporarily unused
// import { Button } from "@/components/ui/button"; // Temporarily unused
import { Coins, Package } from "lucide-react"; // Keep only used icons
import useGameStore from "../store/useGameStore";
// No shallow import needed for individual selectors
import InteractiveFusionSection from "./components/InteractiveFusionSection"; // Still simplified

// TODO: Create these components later
// import CowList from "@/components/farm/CowList"; 
// import PurchaseCowSection from "@/components/farm/PurchaseCowSection";
// import FuseCowSection from "@/components/farm/FuseCowSection";
// import YieldBoosterSection from "@/components/farm/YieldBoosterSection";

export default function FusionPage() {
  // Select primitives individually
  const userNilkBalance = useGameStore(state => state.userNilkBalance);
  const userRawNilkBalance = useGameStore(state => state.userRawNilkBalance);
  const numOwnedCows = useGameStore(state => state.ownedCows.length);
  const yieldBoosterLevel = useGameStore(state => state.yieldBoosterLevel);

  // Enhanced card style with neon green accent
  const factoryCardStyle = "bg-slate-900/80 border border-lime-500/70 rounded-2xl p-6 shadow-2xl backdrop-blur-lg text-lime-200";
  const factoryTitleStyle = "text-2xl font-bold text-lime-300 mb-4 flex items-center font-orbitron";

  // Placeholder card style with neon green accent
  const placeholderCardStyle = "bg-slate-950/70 border border-lime-600/50 rounded-xl p-6 shadow-xl backdrop-blur-md text-lime-300";
  const placeholderTitleStyle = "text-xl font-semibold text-lime-200 mb-3 font-orbitron";

  const CowListPlaceholder = () => (
    <div className={placeholderCardStyle}>
      <h3 className={placeholderTitleStyle}>My Herd</h3>
      <p className="text-sm text-lime-400/80">Manage your magnificent moo-vers. (Owned Cows: {numOwnedCows})</p>
    </div>
  );
  const PurchaseCowPlaceholder = () => (
    <div className={placeholderCardStyle}>
      <h3 className={placeholderTitleStyle}>Acquire Bovine Assets</h3>
      <p className="text-sm text-lime-400/80">Expand your herd with fresh talent.</p>
    </div>
  );
  const YieldBoosterPlaceholder = () => (
    <div className={placeholderCardStyle}>
      <h3 className={placeholderTitleStyle}>Enhance Yields</h3>
      <p className="text-sm text-lime-400/80">Upgrade farm-wide yield booster. (Level: {yieldBoosterLevel})</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col text-foreground pt-24">
      <main className="flex-grow">
        {/* Balance Display - Enhanced Style with Neon Green */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={factoryCardStyle}>
            <div className={factoryTitleStyle}>
              <Coins className="w-7 h-7 mr-3 text-lime-400" />
              $NILK Balance
            </div>
            <p className="text-4xl font-bold text-white">{(userNilkBalance || 0).toLocaleString()}</p>
          </div>
          <div className={factoryCardStyle}>
            <div className={factoryTitleStyle}>
              <Package className="w-7 h-7 mr-3 text-lime-400" />
              Raw Nilk Balance
            </div>
            <p className="text-4xl font-bold text-white">{(userRawNilkBalance || 0).toLocaleString()}</p>
          </div>
        </div>

        <InteractiveFusionSection />
        
        {/* Placeholder Sections with updated style */}
        <div className="space-y-6 mt-8">
          <h2 className="text-3xl font-bold text-center text-lime-300 mb-6 font-orbitron">FARM MANAGEMENT</h2>
          <PurchaseCowPlaceholder />
          <CowListPlaceholder />
          <YieldBoosterPlaceholder />
        </div>
      </main>

      <footer className="py-6 mt-8 text-center border-t border-lime-800/50">
        <p className="text-sm text-lime-400/70">&copy; {new Date().getFullYear()} GOT NILK? - Cosmic Cow Farming</p>
      </footer>
    </div>
  );
} 