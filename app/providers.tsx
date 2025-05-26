"use client";

import * as React from 'react';
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { mainnet, sepolia } from 'wagmi/chains'; // Re-adding import for Ethereum chains
// import { mainnet, sepolia } from 'wagmi/chains'; // Temporarily commented out

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
  testnet: true,
} as const;

// Use the config directly from getDefaultConfig
const config = getDefaultConfig({
  appName: "GOT NILK?", // Corrected appName here
  projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect Project ID
  chains: [hyperliquidMainnet, hyperliquidTestnet, mainnet, sepolia], // Re-adding mainnet and sepolia
  ssr: true, // Important for Next.js
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null; // Prevent rendering on the server or before mount
  }

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
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 