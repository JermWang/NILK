// Price Service for multiple token price tracking
// Maintains accurate pricing for HYPE, SOL, ETH, BTC, and NILK

interface PriceData {
  price: number;
  lastUpdated: number;
  source: string;
  change24h?: number; // 24h price change percentage
}

interface MultiPriceCache {
  hype: PriceData | null;
  sol: PriceData | null;
  eth: PriceData | null;
  btc: PriceData | null;
  nilk: PriceData | null;
  cacheExpiry: number; // 5 minutes cache
}

class PriceService {
  private cache: MultiPriceCache = {
    hype: null,
    sol: null,
    eth: null,
    btc: null,
    nilk: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  };

  // Free APIs for multiple crypto prices
  private priceAPIs = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=hyperliquid,solana,ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true',
      parser: (data: any) => ({
        hype: { price: data.hyperliquid?.usd, change24h: data.hyperliquid?.usd_24h_change },
        sol: { price: data.solana?.usd, change24h: data.solana?.usd_24h_change },
        eth: { price: data.ethereum?.usd, change24h: data.ethereum?.usd_24h_change },
        btc: { price: data.bitcoin?.usd, change24h: data.bitcoin?.usd_24h_change }
      })
    },
    {
      name: 'CryptoCompare',
      url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=HYPE,SOL,ETH,BTC&tsyms=USD',
      parser: (data: any) => ({
        hype: { 
          price: data.RAW?.HYPE?.USD?.PRICE, 
          change24h: data.RAW?.HYPE?.USD?.CHANGEPCT24HOUR 
        },
        sol: { 
          price: data.RAW?.SOL?.USD?.PRICE, 
          change24h: data.RAW?.SOL?.USD?.CHANGEPCT24HOUR 
        },
        eth: { 
          price: data.RAW?.ETH?.USD?.PRICE, 
          change24h: data.RAW?.ETH?.USD?.CHANGEPCT24HOUR 
        },
        btc: { 
          price: data.RAW?.BTC?.USD?.PRICE, 
          change24h: data.RAW?.BTC?.USD?.CHANGEPCT24HOUR 
        }
      })
    }
  ];

  async getAllPrices(): Promise<MultiPriceCache> {
    // Check cache first
    const now = Date.now();
    if (this.cache.hype && 
        now - this.cache.hype.lastUpdated < this.cache.cacheExpiry) {
      return this.cache;
    }

    // Try each API until one works
    for (const api of this.priceAPIs) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) continue;

        const data = await response.json();
        const parsed = api.parser(data);

        // Update cache with valid prices
        const timestamp = now;
        const source = api.name;

        if (parsed.hype?.price) {
          this.cache.hype = {
            price: parsed.hype.price,
            change24h: parsed.hype.change24h || 0,
            lastUpdated: timestamp,
            source
          };
        }

        if (parsed.sol?.price) {
          this.cache.sol = {
            price: parsed.sol.price,
            change24h: parsed.sol.change24h || 0,
            lastUpdated: timestamp,
            source
          };
        }

        if (parsed.eth?.price) {
          this.cache.eth = {
            price: parsed.eth.price,
            change24h: parsed.eth.change24h || 0,
            lastUpdated: timestamp,
            source
          };
        }

        if (parsed.btc?.price) {
          this.cache.btc = {
            price: parsed.btc.price,
            change24h: parsed.btc.change24h || 0,
            lastUpdated: timestamp,
            source
          };
        }

        // Estimate NILK price (this could be enhanced with actual trading data)
        this.cache.nilk = {
          price: 0.001, // Conservative estimate: $0.001 per NILK
          change24h: 0, // No change data available yet
          lastUpdated: timestamp,
          source: 'Estimated'
        };

        console.log(`[PriceService] All prices updated from ${api.name}`);
        break;

      } catch (error) {
        console.warn(`[PriceService] Failed to fetch from ${api.name}:`, error);
        continue;
      }
    }

    return this.cache;
  }

  // Legacy method for backward compatibility
  async getHYPEPrice(): Promise<number> {
    const prices = await this.getAllPrices();
    return prices.hype?.price || 42;
  }

  // Get specific token price
  async getTokenPrice(token: 'hype' | 'sol' | 'eth' | 'btc' | 'nilk'): Promise<PriceData | null> {
    const prices = await this.getAllPrices();
    return prices[token];
  }

  // Calculate HYPE equivalent for NILK amounts
  calculateHYPEPrice(nilkAmount: number, nilkUSDValue: number = 0.001): number {
    const hyePrice = this.cache.hype?.price || 42;
    const nilkUSDAmount = nilkAmount * nilkUSDValue;
    return Number((nilkUSDAmount / hyePrice).toFixed(3));
  }

  // Get current cache status
  getCacheStatus(): { 
    prices: MultiPriceCache; 
    age: number; 
    source: string | null;
  } {
    const oldestUpdate = Math.min(
      this.cache.hype?.lastUpdated || 0,
      this.cache.sol?.lastUpdated || 0,
      this.cache.eth?.lastUpdated || 0,
      this.cache.btc?.lastUpdated || 0
    );

    return {
      prices: this.cache,
      age: Date.now() - oldestUpdate,
      source: this.cache.hype?.source || null
    };
  }

  // Force refresh all prices
  async refreshAllPrices(): Promise<MultiPriceCache> {
    // Clear cache
    this.cache = {
      hype: null,
      sol: null,
      eth: null,
      btc: null,
      nilk: null,
      cacheExpiry: this.cache.cacheExpiry
    };
    return await this.getAllPrices();
  }
}

// Singleton instance
export const priceService = new PriceService();

// Utility functions for components
export const getHYPEPrice = () => priceService.getHYPEPrice();
export const getAllPrices = () => priceService.getAllPrices();
export const getTokenPrice = (token: 'hype' | 'sol' | 'eth' | 'btc' | 'nilk') => 
  priceService.getTokenPrice(token);
export const calculateHYPEEquivalent = (nilkAmount: number, nilkUSDValue?: number) => 
  priceService.calculateHYPEPrice(nilkAmount, nilkUSDValue);
export const refreshAllPrices = () => priceService.refreshAllPrices();

// Auto-refresh prices every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    priceService.getAllPrices().catch(console.error);
  }, 10 * 60 * 1000); // 10 minutes
}

export default priceService; 