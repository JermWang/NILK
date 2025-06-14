"use client"

import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Tractor, Factory, Combine, Info, Coins, FlaskConical, Trophy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import WalletConnection from "@/app/components/WalletConnection";
import ProfileModal from "@/app/components/ProfileModal";
import MusicWidget from "@/app/components/layout/MusicWidget";
import PriceTicker from "@/app/components/layout/PriceTicker";
import useGameStore from "@/app/store/useGameStore";
import { useAccount } from 'wagmi';
import { shallow } from 'zustand/shallow';

const gameLinks = [
  { href: '/farm', label: 'Farm', icon: Tractor },
  { href: '/processing', label: 'Nilk Factory', icon: Factory },
  { href: '/crafting', label: 'Crafting', icon: FlaskConical },
  { href: '/fusion', label: 'Fusion', icon: Combine },
];

const defiLinks = [
    { href: '/liquidity', label: 'Liquidity Pools', icon: Coins },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const userProfile = useGameStore((state) => state.userProfile, shallow);

  const getAvatarFallback = () => {
    if (userProfile.username) {
      return userProfile.username.slice(0, 2).toUpperCase();
    }
    if (address) {
      return address.slice(2, 4).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-lime-500/30 shadow-2xl">
        {/* Main Navigation Row */}
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3">
          <Link href="/" legacyBehavior passHref>
                          <a className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-lime-500/30 p-1">
                  <img src="/NILK logo.png" alt="GOT NILK? Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent font-title">
                    GOT NILK?
                  </h1>
                  <div className="flex items-center">
                    <p className="text-xs text-green-300 mr-1">Hyperliquid EVM</p>
                    <Image src="/hyperliquid.png" alt="Hyperliquid Logo" width={14} height={14} className="object-contain" />
                  </div>
                </div>
            </a>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <Link href="/" legacyBehavior passHref>
              <a className={`font-title flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-lg transition-colors duration-200 hover:text-lime-300 hover:bg-lime-500/10 ${pathname === '/' ? 'text-lime-400 bg-lime-500/20 border border-lime-500/30' : 'text-gray-300'}`}>
                <Info className="w-4 h-4 mr-1.5" />Info
              </a>
            </Link>

            {/* Game Hub Dropdown */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className={`font-title flex items-center space-x-1 text-lg hover:text-lime-300 hover:bg-lime-500/10 px-2 py-1 sm:px-3 sm:py-2 ${gameLinks.some(link => pathname === link.href) ? 'text-lime-400 bg-lime-500/20 border border-lime-500/30' : 'text-gray-300'}`}>
                        <span>Game Hub</span>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-slate-900/95 border-lime-500/50 text-lime-200 p-2">
                    <div className="grid gap-1">
                        {gameLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={`flex items-center space-x-3 p-2 rounded-md hover:bg-lime-700/30 hover:text-lime-100 transition-colors ${pathname === link.href ? 'text-lime-300 bg-lime-700/20' : ''}`}>
                                <link.icon className="h-5 w-5" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
            
            {/* DeFi Dropdown */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className={`font-title flex items-center space-x-1 text-lg hover:text-purple-300 hover:bg-purple-500/10 px-2 py-1 sm:px-3 sm:py-2 ${defiLinks.some(link => pathname === link.href) ? 'text-purple-400 bg-purple-500/20 border border-purple-500/30' : 'text-gray-300'}`}>
                        <span>DeFi</span>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-slate-900/95 border-purple-500/50 text-purple-200 p-2">
                    <div className="grid gap-1">
                        {defiLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={`flex items-center space-x-3 p-2 rounded-md hover:bg-purple-700/30 hover:text-purple-100 transition-colors ${pathname === link.href ? 'text-purple-300 bg-purple-700/20' : ''}`}>
                                <link.icon className="h-5 w-5" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <Link href="/leaderboard" legacyBehavior passHref>
              <a className={`font-title flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-lg transition-colors duration-200 hover:text-yellow-300 hover:bg-yellow-500/10 ${pathname === '/leaderboard' ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30' : 'text-gray-300'}`}>
                <Trophy className="w-4 h-4 mr-1.5" />Leaderboard
              </a>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {/* Music Widget */}
            <div className="hidden sm:block">
              <MusicWidget />
            </div>
            
            {/* Profile Button - only show when connected */}
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center space-x-2 hover:bg-lime-500/10 border border-lime-500/30 hover:border-lime-500/50 transition-all duration-200"
              >
                <Avatar className="w-6 h-6 border border-lime-400/50">
                  <AvatarImage src={userProfile.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gray-700 text-white text-xs">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-gray-300">
                  {userProfile.username || 'Profile'}
                </span>
                {!userProfile.isProfileComplete && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            )}
            <WalletConnection />
          </div>
        </div>

        {/* Price Ticker Row */}
        <div className="border-t border-lime-500/20 bg-black/20 py-1">
          <PriceTicker />
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}