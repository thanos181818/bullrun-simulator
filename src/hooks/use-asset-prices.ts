'use client';

import { useEffect } from 'react';
import type { Asset, PriceData } from '@/lib/types';
import { create } from 'zustand';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AssetPriceStore {
  assets: Asset[];
  assetHistoryCache: Record<string, PriceData[]>;
  isLoading: boolean;
  getAsset: (symbol: string) => Asset | undefined;
  getAssetHistory: (symbol: string) => PriceData[] | undefined;
  setAssets: (newAssets: Asset[]) => void;
  setAssetHistory: (symbol: string, history: PriceData[]) => void;
  updateLivePrices: (priceUpdates: Record<string, number>) => void;
}

const useAssetPriceStore = create<AssetPriceStore>((set, get) => ({
  assets: [],
  assetHistoryCache: {},
  isLoading: true,
  getAsset: (symbol: string) => get().assets.find(a => a.symbol === symbol),
  getAssetHistory: (symbol: string) => get().assetHistoryCache[symbol],
  setAssets: (newAssets: Asset[]) => {
    const enrichedAssets = newAssets.map(asset => {
        const price = asset.price !== undefined ? asset.price : asset.initialPrice;
        const change = price - asset.initialPrice;
        const changePercent = asset.initialPrice > 0 ? (change / asset.initialPrice) * 100 : 0;
        return { ...asset, price, change, changePercent };
    });
    set({ assets: enrichedAssets, isLoading: false });
  },
  setAssetHistory: (symbol: string, history: PriceData[]) => {
    set(state => ({
      assetHistoryCache: { ...state.assetHistoryCache, [symbol]: history }
    }));
  },
  updateLivePrices: (priceUpdates: Record<string, number>) => {
    const now = Date.now();
    set(state => {
      const newAssets = state.assets.map(asset => {
        const newPrice = priceUpdates[asset.symbol];
        if (newPrice !== undefined) {
            const change = newPrice - asset.initialPrice;
            const changePercent = asset.initialPrice > 0 ? (change / asset.initialPrice) * 100 : 0;
            return { ...asset, price: newPrice, change, changePercent };
        }
        return asset;
      });
      
      // Update cached history with latest price
      const newHistoryCache = { ...state.assetHistoryCache };
      Object.keys(priceUpdates).forEach(symbol => {
          if (newHistoryCache[symbol]) {
              const currentHistory = newHistoryCache[symbol];
              const lastTimestamp = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].time : 0;
              if (now > lastTimestamp) {
                  newHistoryCache[symbol] = [...currentHistory, { time: now, price: priceUpdates[symbol] }];
              }
          }
      });

      return { assets: newAssets, assetHistoryCache: newHistoryCache };
    });
  },
}));

// --- Singleton Price Simulator ---

function updateAssetGroup(assets: Asset[]) {
    const state = useAssetPriceStore.getState();
    if (assets.length === 0 || state.isLoading) return;

    const updatedPrices: Record<string, number> = {};

    assets.forEach(asset => {
      const currentAsset = state.getAsset(asset.symbol);
      if (!currentAsset) return;

      // Increased volatility for more realistic fluctuations
      // Crypto: 0.5-2% per update, Stocks: 0.2-1% per update
      const volatility = currentAsset.type === 'crypto' ? 0.015 : 0.006;
      const rand = Math.random() - 0.5;
      let newPrice = (currentAsset.price || currentAsset.initialPrice) * (1 + rand * volatility);

      if (newPrice <= 0.01) {
        newPrice = 0.01;
      }
      
      updatedPrices[currentAsset.symbol] = newPrice;
    });
    
    if (Object.keys(updatedPrices).length > 0) {
        state.updateLivePrices(updatedPrices);
        
        // Update prices in MongoDB via API
        fetch('/api/assets/update-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prices: updatedPrices }),
        }).catch(error => {
          console.error("Failed to write price updates to MongoDB:", error);
        });
    }
}


function startLivePriceSimulator() {
  // Robust singleton check using the global window object, immune to Fast Refresh
  if ((window as any).isBullRunSimulationRunning) {
    console.log("Price simulation is already running.");
    return;
  }
  (window as any).isBullRunSimulationRunning = true;
  
  console.log("Starting the throttled price simulation timers...");

  const allAssets = useAssetPriceStore.getState().assets;
  const highFrequencyAssets = allAssets.slice(0, 8);
  const lowFrequencyAssets = allAssets.slice(8);

  // High-frequency timer (every 60 seconds for top assets - doubled from 30s)
  const highFreqTimer = setInterval(() => {
    updateAssetGroup(highFrequencyAssets);
  }, 60 * 1000); 

  // Low-frequency timer (every 5 minutes for other assets - increased from 2 mins)
  const lowFreqTimer = setInterval(() => {
    updateAssetGroup(lowFrequencyAssets);
  }, 5 * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(highFreqTimer);
    clearInterval(lowFreqTimer);
  };
}
// --- End of Singleton Price Simulator ---


export function useAssetPrices() {
  const store = useAssetPriceStore();

  const { data: dbAssets, isLoading: isDbAssetsLoading } = useSWR<Asset[]>('/api/assets', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes (reduced from 60s)
    dedupingInterval: 60000, // Dedupe requests for 1 minute
    focusThrottleInterval: 300000, // Don't revalidate on focus more than once per 5 minutes
    revalidateOnFocus: false, // Don't revalidate on window focus
  });
  
  useEffect(() => {
    // Load assets from database and start price simulation
    if (dbAssets && dbAssets.length > 0 && store.assets.length === 0) {
      store.setAssets(dbAssets);
      startLivePriceSimulator();
    }
  }, [dbAssets, store]);
  
  return { ...store, isLoading: store.isLoading || isDbAssetsLoading };
}

// Hook to fetch price history for a specific asset
export function useAssetHistory(symbol: string, range: string = '1D') {
  const store = useAssetPriceStore();
  
  const { data, error, isLoading } = useSWR<PriceData[]>(
    symbol ? `/api/price-history?symbol=${symbol}&range=${range}` : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      focusThrottleInterval: 120000, // Don't revalidate more than once per 2 minutes
      errorRetryInterval: 30000, // Retry failed requests every 30s
      errorRetryCount: 3, // Max 3 retries
    }
  );

  useEffect(() => {
    if (data && symbol) {
      store.setAssetHistory(symbol, data);
    }
  }, [data, symbol]);

  return {
    data: store.getAssetHistory(symbol) || data || [],
    isLoading,
    error,
  };
}
