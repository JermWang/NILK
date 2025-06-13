"use client";

import * as React from 'react';
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { mainnet } from 'wagmi/chains';
import { AuthProvider } from './context/AuthContext';

// Define custom chains
const hyperliquidMainnet = {
  id: 999,
  name: "Hyperliquid",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hyperliquid.xyz/evm"] },
    public: { http: ["https://rpc.hyperliquid.xyz/evm"] },
  },
  blockExplorers: {
    default: { name: "Hyperliquid Explorer", url: "https://explorer.hyperliquid.xyz" }, // Assuming an explorer exists, replace if not
  },
  iconUrl: "/hyperliquid.png",
  testnet: false,
} as const;

const hyperliquidTestnet = {
  id: 998,
  name: "Hyperliquid Testnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hyperliquid-testnet.xyz/evm"] },
    public: { http: ["https://rpc.hyperliquid-testnet.xyz/evm"] },
  },
  blockExplorers: {
    default: { name: "Hyperliquid Testnet Explorer", url: "https://testnet-explorer.hyperliquid.xyz" }, // Assuming an explorer exists, replace if not
  },
  iconUrl: "/hyperliquid.png",
  testnet: true,
} as const;

const queryClient = new QueryClient();
const config = getDefaultConfig({
  appName: "GOT NILK?",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  chains: [hyperliquidMainnet, hyperliquidTestnet, mainnet],
  ssr: true, // Important for Next.js
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: "#37FD12",
            accentColorForeground: "#000000",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          appInfo={{
            appName: "GOT NILK?",
            learnMoreUrl: "https://hyperliquid.xyz/"
          }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 