import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, ShoppingCart, Info, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import type { UpgradeItem } from "@/app/config/marketItems";
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useGameStore from '@/app/store/useGameStore';
import { HYPEPriceDisplay } from '@/app/components/HYPEPriceDisplay';

interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  items: UpgradeItem[];
  handleInitiatePurchase: (item: UpgradeItem, quantity: number, unitPrice: number, currency: '$NILK' | 'Raw Nilk') => void;
  isOwnedAlienFarmerBoost: boolean;
  isOwnedMoofiBadge: boolean;
  userNilkBalance: number;
  userRawNilkBalance: number;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  isOpen,
  onClose,
  items,
  handleInitiatePurchase,
  isOwnedAlienFarmerBoost,
  isOwnedMoofiBadge,
  userNilkBalance,
  userRawNilkBalance,
}) => {
  const calculateDynamicHYPEPrice = useGameStore((state) => state.actions.calculateDynamicHYPEPrice);
  const dynamicPricing = useGameStore((state) => state.dynamicPricing);
  
  if (!isOpen) return null;

  const renderMarketItemCard = (item: UpgradeItem) => {
    const isOwned = (item.isUniquePurchase && item.category === 'boosters' && item.id === 'buy_alien_farmer_boost' && isOwnedAlienFarmerBoost) ||
                    (item.isUniquePurchase && item.category === 'boosters' && item.id === 'buy_moofi_badge' && isOwnedMoofiBadge);
    
    const canAffordNilk = item.cost ? userNilkBalance >= item.cost : true;
    const canAffordRawNilk = item.costRawNilk ? userRawNilkBalance >= item.costRawNilk : true;
    const canAfford = canAffordNilk && canAffordRawNilk;

    const basePrice = item.cost ?? item.costRawNilk ?? 0;
    const currency = item.cost ? '$NILK' : 'Raw Nilk';
    
    // Calculate dynamic HYPE price
    const dynamicHYPEPrice = item.cost ? calculateDynamicHYPEPrice(item.cost) : 0;
    const hypeUSDValue = dynamicHYPEPrice * dynamicPricing.hyePrice;

    return (
      <div key={item.id} className="bg-gray-800/80 rounded-lg p-4 flex flex-col justify-between min-h-[320px] relative">
        {isOwned && (
          <div className="absolute inset-0 bg-green-900/80 rounded-lg flex items-center justify-center z-10">
            <span className="text-white font-bold text-base">OWNED</span>
          </div>
        )}
        <div className="text-center flex-grow flex flex-col">
          <Image src={item.image} alt={item.name} width={100} height={100} className="mx-auto mb-3 rounded-md" />
          <h3 className="text-sm font-bold text-lime-300 mb-2">{item.name}</h3>
          <p className="text-xs text-gray-300 mb-3 flex-grow">{item.description}</p>
          {Object.keys(item.stats ?? {}).length > 0 && (
            <div className="text-xs text-gray-400 space-y-1 mb-3">
              {Object.entries(item.stats ?? {}).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="font-semibold text-lime-400">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto space-y-2">
          {/* NILK Price */}
          <div className="text-center">
            <div className="text-xs text-gray-400">NILK Price</div>
            <div className="text-sm font-bold text-lime-400">
              {basePrice.toLocaleString()} {currency}
            </div>
          </div>
          
          {/* Dynamic HYPE Price */}
          {dynamicHYPEPrice > 0 && (
            <div className="text-center">
              <div className="text-xs text-purple-400">HYPE Price</div>
              <div className="text-sm font-bold text-purple-300">
                {dynamicHYPEPrice.toFixed(3)} HYPE
              </div>
              <div className="text-xs text-gray-500">
                (~${hypeUSDValue.toFixed(2)} USD)
              </div>
            </div>
          )}
          
          <Button
            className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs py-2"
            onClick={() => handleInitiatePurchase(item, 1, basePrice, currency)}
            disabled={isOwned || !canAfford}
          >
            {isOwned ? "Owned" : "Purchase"}
          </Button>
        </div>
      </div>
    );
  };

  const categories: UpgradeItem['category'][] = ['cows', 'machines', 'flasks', 'boosters'];
  const categorizedItems = categories.map(cat => ({
    category: cat,
    items: items.filter(item => item.category === cat)
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900/90 border-2 border-lime-500/50 rounded-xl w-full max-w-4xl h-[75vh] flex flex-col p-4 shadow-2xl shadow-lime-500/20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-lime-400 flex items-center">
              <ShoppingCart className="mr-2 h-6 w-6" /> NILK Market
            </h2>
            <HYPEPriceDisplay showDetails={false} className="scale-75" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
            <XCircle className="h-6 w-6 text-red-500" />
          </Button>
        </div>

        <Tabs defaultValue="cows" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/80 h-10">
            {categorizedItems.map(({ category }) => (
              <TabsTrigger key={category} value={category} className="capitalize text-sm py-2 data-[state=active]:bg-lime-600 data-[state=active]:text-black">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categorizedItems.map(({ category, items }) => (
            <TabsContent key={category} value={category} className="flex-grow mt-3 pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {items.map(renderMarketItemCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace; 