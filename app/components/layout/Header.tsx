"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Tractor, FlaskConical, Combine, Droplets, Trophy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

const gameLinks = [
  { href: '/farm', label: 'Farm', icon: Tractor },
  { href: '/foundry', label: 'Foundry', icon: FlaskConical },
  { href: '/fusion', label: 'Fusion', icon: Combine },
];

const defiLinks = [
    { href: '/liquidity', label: 'Liquidity Pools', icon: Droplets },
];

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between p-4 text-white">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/nilk token.png" alt="NILK Token" width={40} height={40} />
          <span className="text-xl font-bold font-title text-lime-300">NILKhype</span>
        </Link>

        <div className="flex items-center space-x-4">
            {/* Game Hub Dropdown */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-lg hover:bg-lime-700/30 hover:text-lime-100">
                        <span>Game Hub</span>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-slate-900/95 border-lime-500/50 text-lime-200 p-2">
                    <div className="grid gap-1">
                        {gameLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="flex items-center space-x-3 p-2 rounded-md hover:bg-lime-700/30 hover:text-lime-100 transition-colors">
                                <link.icon className="h-5 w-5 text-lime-400" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* DeFi Dropdown */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-lg hover:bg-purple-700/30 hover:text-purple-100">
                        <span>DeFi</span>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-slate-900/95 border-purple-500/50 text-purple-200 p-2">
                    <div className="grid gap-1">
                        {defiLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="flex items-center space-x-3 p-2 rounded-md hover:bg-purple-700/30 hover:text-purple-100 transition-colors">
                                <link.icon className="h-5 w-5 text-purple-400" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <Link href="/leaderboard" passHref>
                 <Button variant="ghost" className="flex items-center space-x-2 text-lg hover:bg-yellow-700/30 hover:text-yellow-100">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span>Leaderboard</span>
                </Button>
            </Link>
        </div>

        <div>
            {/* Wallet Connect Button Placeholder */}
            <Button className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold">
                Connect Wallet
            </Button>
        </div>
      </nav>
    </header>
  );
}
 