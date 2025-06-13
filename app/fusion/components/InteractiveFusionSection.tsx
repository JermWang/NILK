'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useGameStore, { useGameActions, COW_STATS } from '../../store/useGameStore'; 
import type { Cow as StoreCow, CowTier } from '../../store/useGameStore'; 
// No shallow import needed for individual selectors
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Atom, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

const playSound = (soundFile: string) => {
    try {
        const audio = new Audio(soundFile);
        audio.play().catch(error => {
            // Autoplay was prevented, which is common in browsers.
            // Log this for debugging but don't bother the user.
            console.warn("Audio autoplay was prevented:", error);
        });
    } catch (error) {
        console.error("Error playing sound:", error);
    }
};

// Interface for displayed cows, similar to CowListItem in app/page.tsx
interface DisplayCow extends StoreCow {
  // Already has id, tier, name, level, currentRawNilkPerDay, imageUrl from StoreCow
  // Add any other UI-specific properties if needed, e.g., derived rarity string
  rarityName: string; 
}

const InteractiveFusionSection = () => {
  // Restore individual selectors
  const ownedCows = useGameStore(state => state.ownedCows);
  const userNilkBalance = useGameStore(state => state.userNilkBalance);
  const gameActions = useGameActions();

  const [selectedCowsForFusion, setSelectedCowsForFusion] = useState<string[]>([]);
  const [fusionMessage, setFusionMessage] = useState<string | null>(null);
  const [isFusing, setIsFusing] = useState(false);

  // Restore useMemo for displayCowList
  const displayCowList: DisplayCow[] = useMemo(() => 
    ownedCows.map(cow => ({
      ...cow,
      rarityName: COW_STATS[cow.tier]?.name || cow.tier.charAt(0).toUpperCase() + cow.tier.slice(1),
    })),
  [ownedCows]);

  const handleToggleCowSelection = (cowId: string) => {
    setSelectedCowsForFusion(prev =>
      prev.includes(cowId) ? prev.filter(id => id !== cowId) : [...prev, cowId]
    );
    setFusionMessage(null); 
  };

  // Restore useMemo for currentFusionDetails (ensure userNilkBalance is correctly accessed)
  const currentFusionDetails = useMemo(() => {
    const selectedCowObjects = selectedCowsForFusion
      .map(id => displayCowList.find(cow => cow.id === id))
      .filter(Boolean) as DisplayCow[];

    let fee = 0;
    let resultTier: CowTier | null = null;
    let resultName = "";
    let canFuse = false;
    let requiredInputsMessage = `Requires ${COW_STATS.cosmic.inputsForFusion?.count}x ${COW_STATS.common.name} OR ${COW_STATS.galactic_moo_moo.inputsForFusion?.count}x ${COW_STATS.cosmic.name}.`;

    if (selectedCowObjects.length === COW_STATS.cosmic.inputsForFusion?.count && 
        selectedCowObjects.every(cow => cow.tier === COW_STATS.cosmic.inputsForFusion?.tierInput)) {
      fee = COW_STATS.cosmic.fusionFee || 0;
      resultTier = 'cosmic';
      resultName = COW_STATS.cosmic.name;
      canFuse = true;
      requiredInputsMessage = "";
    } else if (selectedCowObjects.length === COW_STATS.galactic_moo_moo.inputsForFusion?.count && 
               selectedCowObjects.every(cow => cow.tier === COW_STATS.galactic_moo_moo.inputsForFusion?.tierInput)) {
      fee = COW_STATS.galactic_moo_moo.fusionFee || 0;
      resultTier = 'galactic_moo_moo';
      resultName = COW_STATS.galactic_moo_moo.name;
      canFuse = true;
      requiredInputsMessage = "";
    }
    
    const hasEnoughNilk = userNilkBalance >= fee;
    if (canFuse && !hasEnoughNilk) {
        requiredInputsMessage = "Insufficient $NILK balance for fusion fee.";
    }

    return { 
        fee, 
        resultTier, 
        resultName, 
        canFuse: canFuse && hasEnoughNilk, 
        selectedCowObjects, 
        requiredInputsMessage, 
        hasEnoughNilk,
        hasEnoughNilkButWrongSelection: canFuse && !hasEnoughNilk
    };
  }, [selectedCowsForFusion, displayCowList, userNilkBalance]);

  // Restore full handleConfirmFusion logic
  const handleConfirmFusion = async () => {
    if (!currentFusionDetails.canFuse) {
      setFusionMessage("Cannot perform this fusion. Invalid selection or insufficient funds.");
      return;
    }
    setIsFusing(true);
    setFusionMessage(null);

    const success = gameActions.fuseCows(selectedCowsForFusion, currentFusionDetails.resultTier!);

    setTimeout(() => { 
        setIsFusing(false);
        if (success) {
            playSound("/sounds/sparkles.mp3");
            setFusionMessage(`Fusion successful! You created a ${currentFusionDetails.resultName}.`);
            setSelectedCowsForFusion([]); 
        } else {
            setFusionMessage("Fusion failed. Please check your selection and $NILK balance.");
        }
    }, 750);
  };

  return (
    <div className="my-8 p-6 sm:p-8 bg-slate-900/80 border border-lime-700/60 rounded-3xl shadow-2xl backdrop-blur-lg text-white">
      <div className="flex items-center justify-center mb-6">
        <Atom size={36} className="mr-3 text-lime-300" />
        <h3 className="text-3xl sm:text-4xl font-bold text-lime-300 font-orbitron">The Fusion Chamber</h3>
      </div>

      <div className="my-6 text-center">
        <p className="text-lg text-lime-200/90">Select cows from your herd to attempt fusion.</p>
        <p className="text-sm text-lime-400/80 mt-1">(E.g., {COW_STATS.cosmic.inputsForFusion?.count}x {COW_STATS.common.name} → 1x {COW_STATS.cosmic.name})</p>
      </div>

      <div className="min-h-[250px] bg-slate-800/60 border border-lime-700/50 rounded-xl p-4 my-6 shadow-inner">
        {displayCowList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayCowList.map(cow => {
              const isSelected = selectedCowsForFusion.includes(cow.id);
              return (
                <div 
                  key={cow.id}
                  onClick={() => handleToggleCowSelection(cow.id)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 
                              ${isSelected 
                                ? 'bg-lime-700/70 border-lime-400 shadow-lg scale-105' 
                                : 'bg-slate-700/70 border-lime-600/60 hover:border-lime-400/90 shadow-md'}`}
                >
                  <Avatar className={`h-16 w-16 border-2 mb-3 ${isSelected ? 'border-lime-300' : 'border-lime-600'}`}>
                    <AvatarImage src={cow.imageUrl || ''} alt={cow.name} />
                    <AvatarFallback className={`${isSelected ? 'bg-lime-500' : 'bg-lime-700/80'} text-white text-xl`}>{cow.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className={`text-md font-semibold ${isSelected ? 'text-white' : 'text-lime-200'}`}>{cow.name}</p>
                    <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${isSelected ? 'bg-lime-300/30 text-lime-100' : 'bg-lime-500/30 text-lime-300'}`}>
                        Tier: {cow.rarityName}
                    </div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-lime-200/90' : 'text-lime-400/80'}`}>Lvl: {cow.level} | Yield: {cow.currentRawNilkPerDay.toFixed(1)}/day</div>
                  </div>
                  {isSelected && <CheckCircle2 size={28} className="text-green-300 absolute top-2 right-2" />}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-lime-300/80 py-16 text-lg">You have no cows in your herd to fuse.</p>
        )}
      </div>

      <div className="my-8 p-6 bg-slate-800/70 rounded-xl border border-lime-600/80 shadow-lg min-h-[100px]">
        {currentFusionDetails.selectedCowObjects.length === 0 && <p className="text-center text-lime-300/80 text-md py-4">Select cows above to see fusion details.</p>}
        {currentFusionDetails.selectedCowObjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 items-center">
            <p className="text-lime-200 text-lg">Fusion Fee: <span className={`font-semibold text-xl ${currentFusionDetails.hasEnoughNilk || !currentFusionDetails.canFuse ? 'text-white' : 'text-red-400'}`}>{currentFusionDetails.fee} $NILK</span></p>
            <p className="text-lime-200 text-lg">Expected Result: <span className="font-semibold text-xl text-white">{currentFusionDetails.resultName || "N/A (Invalid)"}</span></p>
            {currentFusionDetails.requiredInputsMessage && !currentFusionDetails.resultName && (
                <p className="text-yellow-400/90 mt-1 text-sm md:col-span-2 text-center">{currentFusionDetails.requiredInputsMessage}</p>
            )}
            {!currentFusionDetails.hasEnoughNilk && currentFusionDetails.resultName && (
                 <p className="text-red-500 mt-1 text-sm md:col-span-2 text-center">Insufficient $NILK for fusion fee.</p>
            )}
          </div>
        )}
      </div>
        
      {fusionMessage && (
          <p className={`p-4 my-4 rounded-lg text-center text-md shadow-md ${fusionMessage.includes('success') ? 'bg-green-500/90 border border-green-400/70 text-white' : 'bg-red-500/90 border border-red-400/70 text-white'}`}>
              {fusionMessage}
          </p>
      )}

      <Button 
        onClick={handleConfirmFusion}
        disabled={!currentFusionDetails.canFuse || isFusing}
        className="w-full bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500 hover:from-lime-600 hover:via-green-600 hover:to-emerald-600 text-white font-bold py-4 text-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        {isFusing ? <Loader2 size={26} className="animate-spin mr-3" /> : <Sparkles size={24} className="mr-3"/>}
        {isFusing ? 'Fusing Cosmic Energies...' : 'Initiate Fusion'}
      </Button>
    </div>
  );
};

export default InteractiveFusionSection; 