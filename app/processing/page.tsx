"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Factory, Package, Coins, Zap, Tractor, Loader2, ShoppingCart, XCircle, CheckCircle2, Gift, Check, Info, Combine } from "lucide-react"
import useGameStore, { useGameActions, MachineType, MACHINES, MANUAL_PROCESSING_STATS, Machine } from "../store/useGameStore"
import type { GameActions } from "../store/useGameStore"

// Sound effect utility
const playSound = (soundFile: string) => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.3;
    audio.play().catch(error => console.error("Error playing sound:", error));
  } catch (error) {
    console.error("Could not play sound", error);
  }
};

interface SuccessPopupState {
  show: boolean;
  machineName?: string;
  imageSrc?: string;
  amountProcessed?: number;
  nilkReceived?: number;
  feePaid?: number;
  title?: string;
  message?: string;
}

export default function ProcessingPage() {
  const pathname = usePathname()
  const userNilkBalance = useGameStore((state) => state.userNilkBalance)
  const userRawNilkBalance = useGameStore((state) => state.userRawNilkBalance)
  const ownedMachines = useGameStore((state) => state.ownedMachines)
  const { 
    increaseNilkBalance, 
    decreaseNilkBalance, 
    decreaseRawNilkBalance, 
    increaseTreasuryBalance, 
    addOwnedMachine: addOwnedMachineAction,
    performMachineFusion: performMachineFusionAction
  } = useGameActions() as GameActions

  const [amountToProcess, setAmountToProcess] = useState("")
  const [processingMessage, setProcessingMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const [isMachineFusionModalOpen, setIsMachineFusionModalOpen] = useState(false); // State for machine fusion modal

  const [successPopup, setSuccessPopup] = useState<SuccessPopupState>({
    show: false, 
  });

  const sparkleContainerRef = useRef<HTMLDivElement>(null);

  const initialSelectedMachineId = useMemo(() => {
    if (ownedMachines.pro > 0) return 'pro';
    if (ownedMachines.standard > 0) return 'standard';
    return 'manual';
  }, [ownedMachines]);

  const [selectedMachineId, setSelectedMachineId] = useState<MachineType>(initialSelectedMachineId);

  useEffect(() => {
    setSelectedMachineId(initialSelectedMachineId);
  }, [initialSelectedMachineId]);

  const currentProcessingStats = useMemo(() => {
    if (selectedMachineId === 'manual') {
      return MANUAL_PROCESSING_STATS;
    }
    return MACHINES[selectedMachineId as Exclude<MachineType, 'manual'>];
  }, [selectedMachineId]);

  const [feeAmountDeducted, setFeeAmountDeducted] = useState(0)
  const [netNilkToReceive, setNetNilkToReceive] = useState(0)

  useEffect(() => {
    const amount = parseFloat(amountToProcess)
    if (!isNaN(amount) && amount > 0 && currentProcessingStats) {
      const grossNilkValue = amount * currentProcessingStats.conversionRate;
      const fee = grossNilkValue * (currentProcessingStats.feePercentage / 100);
      const netOutput = grossNilkValue - fee;
      setFeeAmountDeducted(fee)
      setNetNilkToReceive(netOutput)
    } else {
      setFeeAmountDeducted(0)
      setNetNilkToReceive(0)
    }
  }, [amountToProcess, currentProcessingStats])

  const handleSetMax = () => {
    setAmountToProcess(userRawNilkBalance.toString());
  };

  const triggerSparkleEffect = (targetElement?: HTMLElement) => {
    if (!sparkleContainerRef.current) return;

    let originX = 0.5;
    let originY = 0.5;

    if (targetElement && sparkleContainerRef.current) {
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = sparkleContainerRef.current.getBoundingClientRect();
        originX = (targetRect.left + targetRect.width / 2 - containerRect.left) / containerRect.width;
        originY = (targetRect.top + targetRect.height / 2 - containerRect.top) / containerRect.height;
    }
    
    const numParticles = 20 + Math.floor(Math.random() * 10);
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement("span");
      particle.classList.add("sparkle-particle");
      particle.style.setProperty("--tx", `${originX * 100}%`);
      particle.style.setProperty("--ty", `${originY * 100}%`);
      
      const angle = Math.random() * 360;
      const distance = Math.random() * 60 + 20;
      particle.style.setProperty("--dx", `${Math.cos(angle * Math.PI / 180) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle * Math.PI / 180) * distance}px`);
      particle.style.setProperty("--duration", `${0.5 + Math.random() * 0.5}s`);
      particle.style.setProperty("--delay", `${Math.random() * 0.2}s`);
      particle.style.setProperty("--size", `${5 + Math.random() * 5}px`);
      particle.style.setProperty("--color", `hsl(${100 + Math.random()*60}, 100%, 70%)`);

      sparkleContainerRef.current.appendChild(particle);
      setTimeout(() => {
        particle.remove();
      }, 1000); 
    }
  };

  const handleProcessNilk = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!currentProcessingStats) return;
    setProcessingMessage("")
    const amount = parseFloat(amountToProcess)

    if (isNaN(amount) || amount <= 0) {
      setProcessingMessage("Please enter a valid positive amount to process.")
      return
    }
    if (amount > userRawNilkBalance) {
      setProcessingMessage(`Not enough Raw Nilk. You have ${userRawNilkBalance.toFixed(2)}.`)
      return
    }

    setIsProcessing(true)

    const grossNilkValue = amount * currentProcessingStats.conversionRate;
    const feeCollected = grossNilkValue * (currentProcessingStats.feePercentage / 100);
    const actualNilkReceivedByUser = grossNilkValue - feeCollected;

    setTimeout(() => {
      decreaseRawNilkBalance(amount)
      increaseNilkBalance(actualNilkReceivedByUser)
      increaseTreasuryBalance(feeCollected)

      let imgSource = "/smalljar.png"; // Default to smalljar for manual
      if (currentProcessingStats.id === 'pro') {
        imgSource = "/nilkcrate.png";
      } else if (currentProcessingStats.id === 'standard') {
        imgSource = "/gallonjug.png";
      }
      // Manual processing will use the default smalljar.png

      setSuccessPopup({
        show: true,
        title: "Processing Complete!",
        message: `You processed ${amount.toFixed(2)} Raw Nilk using the ${currentProcessingStats.name}.`,
        imageSrc: imgSource,
        machineName: currentProcessingStats.name,
        amountProcessed: amount,
        nilkReceived: actualNilkReceivedByUser,
        feePaid: feeCollected,
      });
      playSound("/sounds/sparkles.mp3");
      triggerSparkleEffect(event.currentTarget);
      
      setAmountToProcess("")
      setIsProcessing(false)
    }, 750)
  }

  const canProcess = !isProcessing && parseFloat(amountToProcess) > 0 && parseFloat(amountToProcess) <= userRawNilkBalance && !!currentProcessingStats

  const handleBuyMachine = (machineToBuy: Machine, currency: 'nilk' | 'hype' | 'usdc') => {
    let cost = 0;
    let canAfford = false;

    if (currency === 'nilk') {
        cost = machineToBuy.costNilk;
        canAfford = userNilkBalance >= cost;
    } else if (currency === 'hype' && machineToBuy.costHype) {
        alert("HYPE payment not yet implemented."); return;
    } else if (currency === 'usdc' && machineToBuy.costUsdc) {
        alert("USDC payment not yet implemented."); return;
    }

    if (!canAfford && currency === 'nilk') {
        alert(`Not enough $NILK to buy ${machineToBuy.name}.`);
        return;
    }
    
    if (currency === 'nilk' && machineToBuy.id !== 'manual') {
        decreaseNilkBalance(cost);
        increaseTreasuryBalance(cost);
        addOwnedMachineAction(machineToBuy.id as Exclude<MachineType, 'manual'>);
        setSuccessPopup({
            show: true,
            title: `${machineToBuy.name} Acquired!`, 
            message: `You have successfully purchased a ${machineToBuy.name}.`,
            imageSrc: machineToBuy.imageUrl,
        });
        playSound("/sounds/purchase.mp3");
        setIsMachineModalOpen(false);
    }
  };

  const availableMachinesToBuy = useMemo(() => Object.values(MACHINES), []);

  const processingOptions = useMemo(() => {
    const options: Array<{id: MachineType, name: string, owned: boolean, count: number}> = [
      { id: 'manual' as MachineType, name: MANUAL_PROCESSING_STATS.name, owned: true, count: 1 }, // Manual is always available
    ];
    Object.values(MACHINES).forEach(m => {
      // Explicitly assert m.id is not 'manual' here since MACHINES record is typed as such
      const machineKey = m.id as Exclude<MachineType, 'manual'>;
      options.push({ 
        id: m.id, 
        name: m.name, 
        owned: ownedMachines[machineKey] > 0, 
        count: ownedMachines[machineKey]
      });
    });
    return options;
  }, [ownedMachines]);

  const handleConfirmMachineFusion = (event: React.MouseEvent<HTMLButtonElement>) => {
    performMachineFusionAction();
    
    playSound("/sounds/sparkles.mp3");
    triggerSparkleEffect(event.currentTarget);
    setIsMachineFusionModalOpen(false);

    setSuccessPopup({
      show: true,
      title: "Fusion Successful!",
      message: `Successfully fused 2 Standard Machines into 1 Pro Nilk Machine!`,
      imageSrc: MACHINES.pro.imageUrl,
      machineName: MACHINES.pro.name,
    });
  };

  if (isProcessing || !currentProcessingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white p-4">
        <Loader2 className="h-16 w-16 text-lime-400 animate-spin" />
        <p className="ml-4 text-2xl font-semibold font-title">Loading Factory Schematics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col text-foreground pt-40">
      {/* Main Content: Processing & Machine Management wrapped in a single div that was previously being duplicated */}
      <div className="flex-grow">
        {/* Sparkle container and main content area from original structure */}
        <div ref={sparkleContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-[150]" />
        
        <div className="text-center backdrop-blur-md bg-black/60 border border-lime-500/50 rounded-xl shadow-2xl shadow-lime-500/10 p-4 sm:p-8 w-full max-w-3xl space-y-6 mx-auto">
          <div className="flex items-center justify-center">
            <Factory size={48} className="mr-3 text-lime-400" />
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-lime-300 to-green-400 bg-clip-text text-transparent font-title">
              Nilk Factory
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-lg border border-lime-700/50">
              <div className="flex items-center justify-center text-lime-300 mb-1">
                <Package size={20} className="mr-2" />
                <span className="text-sm font-medium">Raw Nilk Stash</span>
              </div>
              <p className="text-2xl font-bold text-lime-400 text-center">
                {userRawNilkBalance.toFixed(2)}
              </p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg border border-lime-700/50">
              <div className="flex items-center justify-center text-lime-300 mb-1">
                <Coins size={20} className="mr-2" />
                <span className="text-sm font-medium">$NILK Balance</span>
              </div>
              <p className="text-2xl font-bold text-lime-400 text-center">
                {userNilkBalance.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg border border-lime-700/50 space-y-3">
            <h3 className="text-xl font-semibold text-lime-300 mb-2">Processing Method</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {processingOptions.map((option) => {
                  const isSelectable = option.id === 'manual' || option.owned;
                  const displayCount = option.id !== 'manual' && option.owned ? `(${option.count})` : '';

                  return (
                    <Button
                      key={option.id}
                      onClick={() => setSelectedMachineId(option.id)}
                      className={`
                        ${selectedMachineId === option.id 
                          ? 'bg-lime-500 hover:bg-lime-600 text-black font-semibold'
                          : 'bg-transparent border border-lime-600 text-lime-300 hover:bg-lime-700/30 hover:text-lime-100'}
                        px-3 py-1.5 text-sm rounded-md 
                        ${!isSelectable ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={!isSelectable}
                    >
                      {option.name} {displayCount}
                    </Button>
                  );
              })}
            </div>
            {currentProcessingStats && (
              <div className="text-sm text-gray-300 bg-black/20 p-3 rounded-md border border-lime-800/60 flex flex-col items-center">
                {currentProcessingStats.imageUrl && (
                  <img 
                    src={currentProcessingStats.imageUrl} 
                    alt={currentProcessingStats.name} 
                    className="w-20 h-20 mb-3 rounded-md bg-lime-900/30 p-1 object-contain"
                  />
                )}
                <p className="font-semibold text-lime-400 text-lg mb-1 text-center">Using: {currentProcessingStats.name}</p>
                <div className="text-center">
                  <p>Conversion Rate: <span className="text-white">{currentProcessingStats.conversionRate * 100}%</span> (Raw Nilk to $NILK value)</p>
                  <p>Processing Fee: <span className="text-white">{currentProcessingStats.feePercentage}%</span> (on $NILK value)</p>
                  <p className="text-xs text-gray-400 mt-1">{currentProcessingStats.description}</p>
                </div>
              </div>
            )}
            {(ownedMachines.standard === 0 && ownedMachines.pro === 0) && (
              <div className="mt-3 text-center p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                <p className="text-yellow-300 font-medium">You don\'t own any processing machines yet!</p>
                <p className="text-yellow-400 text-sm">Manual processing is less efficient. Consider buying a machine.</p>
                <Button 
                  onClick={() => setIsMachineModalOpen(true)} 
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs py-1 px-3"
                >
                  <ShoppingCart className="w-3 h-3 mr-1.5" /> View Machines
                </Button>
              </div>
            )}
            {availableMachinesToBuy.length > 0 && (
               <Button
                  onClick={() => setIsMachineModalOpen(true)}
                  className="w-full mt-3 bg-transparent border border-lime-600 text-lime-300 hover:bg-lime-700/30 hover:text-lime-100 px-4 py-2 text-sm rounded-md"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {ownedMachines.standard > 0 || ownedMachines.pro > 0 ? "Acquire More Machines / View Owned" : "Buy Your First Machine"}
                </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-stretch space-x-2">
              <Input
                type="number"
                placeholder="Raw Nilk to Process"
                value={amountToProcess}
                onChange={(e) => setAmountToProcess(e.target.value)}
                className="bg-black/40 border-lime-700/60 text-white placeholder-gray-500 focus:border-lime-500 h-11 text-base flex-grow min-w-0"
                disabled={isProcessing || !currentProcessingStats}
              />
              <Button
                onClick={handleSetMax}
                className="h-11 bg-transparent border border-lime-600 text-lime-300 hover:bg-lime-700/30 hover:text-lime-100 whitespace-nowrap px-3 text-sm rounded-md"
                disabled={isProcessing || userRawNilkBalance === 0 || !currentProcessingStats}
              >
                Max
              </Button>
            </div>

            {parseFloat(amountToProcess) > 0 && currentProcessingStats && (
              <div className="bg-black/20 border border-lime-800/50 p-3 rounded-md space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount to Process:</span>
                  <span className="text-white font-medium">{parseFloat(amountToProcess).toFixed(2)} Raw Nilk</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base $NILK Value ({currentProcessingStats.conversionRate * 100}%):</span>
                  <span className="text-white font-medium">{(parseFloat(amountToProcess) * currentProcessingStats.conversionRate).toFixed(2)} $NILK</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Processing Fee ({currentProcessingStats.feePercentage}% of value):</span>
                  <span className="text-red-400 font-medium">-{feeAmountDeducted.toFixed(2)} $NILK</span>
                </div>
                <hr className="border-lime-700/40 my-1" />
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-green-300">You Will Receive:</span>
                  <span className="text-lime-400 text-base">~{netNilkToReceive.toFixed(2)} $NILK</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleProcessNilk}
              className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              disabled={!canProcess || isProcessing}
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin mr-2" /> 
              ) : (
                <Zap size={18} className="mr-2" /> 
              )}
              {isProcessing ? 'Processing...' : 'Process Raw Nilk'}
            </Button>

            {processingMessage && !successPopup.show && (
              <p className={`text-sm mt-3 text-red-400 p-2 bg-black/30 rounded-md text-center`}>
                {processingMessage}
              </p>
            )}
          </div>

          <Link href="/" className="mt-6 block">
            <Button
              className="bg-transparent border border-lime-600 text-lime-300 hover:bg-lime-700/30 hover:text-lime-100 rounded-lg font-medium py-2 px-4 text-sm shadow-sm transition-colors duration-300"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Farm
            </Button>
          </Link>

          {/* Add Machine Fusion Button below existing machine shop button or in a new section */}
          <div className="mt-6 pt-6 border-t border-lime-700/50">
              <h2 className="text-2xl font-semibold text-purple-300 mb-3 font-title">Advanced Engineering</h2>
              <Button 
                onClick={() => setIsMachineFusionModalOpen(true)}
                disabled={ownedMachines.standard < 2 || userNilkBalance < (MACHINES.pro.fusionCostNilk || Infinity) || ownedMachines.pro > 0}
                className="w-full text-lg py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 border border-purple-500/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Zap size={22} className="mr-2" /> Machine Fusion Lab
              </Button>
              <p className="text-xs text-purple-400/80 mt-1.5">
                Combine 2 Standard Machines into 1 Pro Machine. Requires <span className="font-semibold text-white">{MACHINES.pro.fusionCostNilk} $NILK</span>.
              </p>
          </div>
        </div>
      </div>

      {/* Modals remain outside the main content flow but within the page root div */}
      {/* Machine Purchase Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-lime-600/70 rounded-xl shadow-2xl shadow-lime-500/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <Button onClick={() => setIsMachineModalOpen(false)} variant="ghost" className="absolute top-3 right-3 text-gray-400 hover:text-lime-300 p-1 h-auto">
              <XCircle size={24} />
            </Button>
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-lime-300 to-green-400 bg-clip-text text-transparent font-title">
              <ShoppingCart className="inline-block mr-3 mb-1" size={30}/> Machine Market
            </h3>

            {(availableMachinesToBuy.length === 0 || (ownedMachines.standard > 0 && ownedMachines.pro > 0)) && (
               <div className="text-center p-6 bg-black/30 rounded-lg border border-lime-700/50">
                <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                <p className="text-xl text-gray-200 font-semibold">You own all available machine types or no machines are available!</p>
                <p className="text-gray-400 mt-1">Check back later for new models or if you sell existing ones.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(MACHINES).map((machine) => {
                const machineKey = machine.id as Exclude<MachineType, 'manual'>;
                const isOwned = ownedMachines[machineKey] > 0;
                const count = ownedMachines[machineKey];
                return (
                  <div key={machine.id} className={`bg-black/40 p-4 rounded-lg border hover:shadow-lime-500/20 transition-shadow duration-300 ${isOwned ? 'border-green-500/60' : 'border-lime-700/50'}`}>
                    <div className="flex items-center mb-3">
                      {machine.imageUrl && <img src={machine.imageUrl} alt={machine.name} className="w-16 h-16 mr-4 rounded-md bg-lime-900/50 p-1"/>}
                      <div>
                          <h4 className="text-lg font-semibold text-lime-300">{machine.name}</h4>
                          {isOwned && <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full font-bold">OWNED ({count})</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 h-10 overflow-hidden">{machine.description}</p>
                    <div className="text-sm space-y-1 mb-3">
                      <p>Rate: <span className="font-medium text-white">{machine.conversionRate * 100}%</span></p>
                      <p>Fee: <span className="font-medium text-white">{machine.feePercentage}%</span></p>
                    </div>
                    
                    <Button 
                        onClick={() => handleBuyMachine(machine, 'nilk')}
                        disabled={userNilkBalance < machine.costNilk}
                        className="w-full bg-lime-500 hover:bg-lime-600 text-black font-semibold text-xs py-1.5">
                        Buy for {machine.costNilk} $NILK {isOwned ? "(Another One)" : ""}
                    </Button>
                    {machine.costHype && (
                        <Button 
                            onClick={() => handleBuyMachine(machine, 'hype')}
                            className="w-full mt-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs py-1.5 opacity-70 cursor-not-implemented">
                            Buy for {machine.costHype} $HYPE (Soon)
                        </Button>
                    )}
                    {machine.costUsdc && (
                        <Button 
                            onClick={() => handleBuyMachine(machine, 'usdc')}
                            className="w-full mt-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs py-1.5 opacity-70 cursor-not-implemented">
                            Buy for {machine.costUsdc} $USDC (Soon)
                        </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Machine Fusion Modal */}
      {isMachineFusionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-gradient-to-br from-gray-800 via-purple-900 to-gray-800 border-2 border-purple-600/70 rounded-xl shadow-2xl shadow-purple-500/20 p-6 sm:p-8 w-full max-w-md text-white relative text-center">
            <Button onClick={() => setIsMachineFusionModalOpen(false)} variant="ghost" className="absolute top-3 right-3 text-gray-400 hover:text-purple-300 p-1 h-auto">
              <XCircle size={28} />
            </Button>
            <div className="flex items-center justify-center mb-5">
              <Zap size={36} className="mr-3 text-purple-400" />
              <h3 className="text-3xl font-bold text-purple-300 font-title">Machine Fusion</h3>
            </div>

            <p className="text-purple-200/90 mb-2">
              You are about to fuse <span className="font-semibold text-white">2 x Standard Nilk Machines</span>.
            </p>
            <p className="text-purple-200/90 mb-4">
              This will produce <span className="font-semibold text-white">1 x Pro Nilk Machine</span>.
            </p>

            <div className="my-5 p-3.5 bg-black/30 rounded-lg border border-purple-700/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-purple-300">Fusion Fee:</span>
                <span className="text-lg font-semibold text-white">{MACHINES.pro.fusionCostNilk} $NILK</span>
              </div>              
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-300">Your $NILK Balance:</span>
                <span className={`text-lg font-semibold ${userNilkBalance >= (MACHINES.pro.fusionCostNilk || Infinity) ? 'text-lime-300' : 'text-red-500'}`}>{userNilkBalance.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={handleConfirmMachineFusion} 
              disabled={ownedMachines.standard < 2 || userNilkBalance < (MACHINES.pro.fusionCostNilk || Infinity) || ownedMachines.pro > 0}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={20} className="mr-2"/> Confirm Fusion
            </Button>
            {ownedMachines.standard < 2 && 
              <p className="text-xs text-yellow-400 mt-2">You need at least 2 Standard Machines to fuse. You have: {ownedMachines.standard}.</p>}
            {ownedMachines.standard >= 2 && userNilkBalance < (MACHINES.pro.fusionCostNilk || Infinity) && 
              <p className="text-xs text-red-500 mt-2">Insufficient $NILK balance for fusion fee.</p>}
          </div>
        </div>
      )}

      {/* Success Pop-up Modal */}
      {successPopup.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-gradient-to-br from-gray-800 via-lime-900 to-gray-800 border-2 border-lime-500 rounded-xl shadow-2xl shadow-lime-400/30 p-6 sm:p-8 w-full max-w-md text-center relative transform transition-all duration-300 ease-out scale-100">
            <Gift size={48} className="mx-auto mb-4 text-lime-300" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-lime-300 to-green-300 bg-clip-text text-transparent font-title">
              {successPopup.title || "Action Successful!"}
            </h3>
            {successPopup.imageSrc && <img src={successPopup.imageSrc} alt={successPopup.machineName || "Success Image"} className="w-32 h-32 sm:w-40 sm:h-40 mx-auto my-4 rounded-lg bg-black/30 p-2 border border-lime-600 object-contain" />}
            {successPopup.message && 
              <p className="text-lime-200 text-sm sm:text-base mb-1">
                {successPopup.message}
              </p>
            }
            {successPopup.nilkReceived !== undefined && (
              <p className="text-xl sm:text-2xl font-bold text-lime-400 mb-2">
                + {successPopup.nilkReceived.toFixed(2)} $NILK
              </p>
            )}
            {successPopup.feePaid !== undefined && (
              <p className="text-xs text-gray-400 mb-4">
                (Fee Paid: {successPopup.feePaid.toFixed(2)} $NILK to treasury)
              </p>
            )}
            <Button 
              onClick={() => setSuccessPopup({ show: false }) }
              className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold py-2.5 text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <Check size={20} className="mr-2"/> Awesome!
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 