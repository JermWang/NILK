"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Tractor, Factory, Combine, Info } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-lime-500/30 shadow-2xl">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
        <Link href="/" legacyBehavior passHref>
          <a className="flex items-center space-x-3 sm:space-x-4 cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-lime-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-lime-500/30 p-1">
              <img src="/NILK logo.png" alt="GOT NILK? Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent font-title">
                GOT NILK?
              </h1>
              <div className="flex items-center">
                <p className="text-xs sm:text-sm text-green-300 mr-1.5">Hyperliquid EVM</p>
                <Image src="/hyperliquid.png" alt="Hyperliquid Logo" width={16} height={16} className="object-contain" />
              </div>
            </div>
          </a>
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <Link href="/" legacyBehavior passHref>
            <a className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 hover:text-lime-300 ${pathname === '/' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-300'}`}>
              <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Info
            </a>
          </Link>
          <Link href="/farm" legacyBehavior passHref>
            <a className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 hover:text-lime-300 ${pathname === '/farm' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-300'}`}>
              <Tractor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Farm
            </a>
          </Link>
          <Link href="/processing" legacyBehavior passHref>
            <a className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 hover:text-lime-300 ${pathname === '/processing' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-300'}`}>
              <Factory className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Nilk Factory
            </a>
          </Link>
          <Link href="/fusion" legacyBehavior passHref>
            <a className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 hover:text-lime-300 ${pathname === '/fusion' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-300'}`}>
              <Combine className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Fusion
            </a>
          </Link>
        </div>
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
} 