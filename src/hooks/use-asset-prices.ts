'use client';

import { useEffect, useMemo } from 'react';
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
    set(state => {
      const currentHistory = state.assetHistoryCache[symbol] || [];
      
      // If the new history is substantially different (e.g., a new duration), overwrite it
      // Otherwise, merge it (preferring API data for historical points)
      let mergedHistory: PriceData[];
      
      if (history.length > 50) {
        // This is likely a full fetch from the API, merge it with existing points if any
        // but prefer the API data for points that overlap
        const historyTimes = new Set(history.map(p => p.time));
        const uniqueCurrent = currentHistory.filter(p => !historyTimes.has(p.time));
        
        mergedHistory = [...history, ...uniqueCurrent].sort((a, b) => a.time - b.time);
        
        // Keep only the last 2000 points to prevent memory issues
        if (mergedHistory.length > 2000) {
          mergedHistory = mergedHistory.slice(mergedHistory.length - 2000);
        }
      } else {
        // Small history update, just replace (or merge if needed)
        mergedHistory = history;
      }
      
      return {
        assetHistoryCache: { ...state.assetHistoryCache, [symbol]: mergedHistory }
      };
    });
  },
  updateLivePrices: (priceUpdates: Record<string, number>) => {
    const now = Date.now();
    set(state => {
      const newAssets = state.assets.map(asset => {
        const newPrice = priceUpdates[asset.symbol];
        if (newPrice !== undefined) {
            const change = newPrice - asset.initialPrice;
            const changePercent = asset.initialPrice > 0 ? (change / asset.initialPrice) * 100 : 0;
            
            // Sync simulation state with the real quote to prevent jumping back
            if (simulationState[asset.symbol]) {
              simulationState[asset.symbol].basePrice = newPrice;
              simulationState[asset.symbol].trendStartPrice = newPrice;
              simulationState[asset.symbol].lastPrice = newPrice;
            }
            
            return { ...asset, price: newPrice, change, changePercent };
        }
        return asset;
      });
      
      // Update cached history with latest price
      const newHistoryCache = { ...state.assetHistoryCache };
      Object.keys(priceUpdates).forEach(symbol => {
          if (newHistoryCache[symbol]) {
              const currentHistory = [...newHistoryCache[symbol]];
              const lastTimestamp = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].time : 0;
              
              // Only add a new point if it's at least 1 second newer
              if (now >= lastTimestamp + 1000) {
                  currentHistory.push({ time: now, price: priceUpdates[symbol] });
                  
                  // Keep only the last 2000 points for performance
                  if (currentHistory.length > 2000) {
                      currentHistory.shift();
                  }
                  
                  newHistoryCache[symbol] = currentHistory;
              }
          }
      });

      return { assets: newAssets, assetHistoryCache: newHistoryCache };
    });
  },
}));

// --- Singleton Price Simulator with Trending ---

// Track simulation state per asset
const simulationState: Record<string, {
  trendStartTime: number,
  trendEndTime: number,
  trendDirection: 1 | -1,
  trendStartPrice: number,
  basePrice: number,
  trendDuration: number,
  lastPrice: number
}> = {};

function initializeSimulationState(symbol: string, currentPrice: number) {
  if (!simulationState[symbol]) {
    const trendDuration = (3 + Math.random() * 2) * 60 * 60 * 1000; // 3-5 hours in ms
    simulationState[symbol] = {
      trendStartTime: Date.now(),
      trendEndTime: Date.now() + trendDuration,
      trendDirection: Math.random() > 0.5 ? 1 : -1,
      trendStartPrice: currentPrice,
      basePrice: currentPrice,
      trendDuration,
      lastPrice: currentPrice
    };
  }
}

function updateAssetGroup(assets: Asset[], isHighFreq: boolean = true) {
    const state = useAssetPriceStore.getState();
    if (assets.length === 0 || state.isLoading) return;

    const updatedPrices: Record<string, number> = {};
    const now = Date.now();

    assets.forEach(asset => {
      const currentAsset = state.getAsset(asset.symbol);
      if (!currentAsset) return;

      const currentPrice = currentAsset.price || currentAsset.initialPrice;
      initializeSimulationState(asset.symbol, currentPrice);

      const sim = simulationState[asset.symbol];
      
      // Check if trend should flip
      if (now > sim.trendEndTime) {
        sim.trendDirection = sim.trendDirection === 1 ? -1 : 1;
        sim.trendStartTime = now;
        sim.trendDuration = (3 + Math.random() * 2) * 60 * 60 * 1000; // 3-5 hours
        sim.trendEndTime = now + sim.trendDuration;
        sim.trendStartPrice = currentPrice;
      }

      // Calculate trend progress (0 to 1 over the trend period)
      const trendProgress = (now - sim.trendStartTime) / sim.trendDuration;
      const clampedProgress = Math.min(trendProgress, 1);
      
      // Trend component: smooth increase/decrease over 3-5 hours
      const trendAmount = sim.trendDirection * sim.basePrice * (0.08 * Math.pow(clampedProgress, 1.2));
      
      // Volatility: small random noise (±0.02% per second for stocks, ±0.05% for crypto)
      // This is the "micro-fluctuation" that makes it look real-time
      const volatility = currentAsset.type === 'crypto' ? 0.0005 : 0.0002;
      const noise = (Math.random() - 0.5) * volatility * sim.basePrice;
      
      // We calculate the target price based on trend + noise
      let targetPrice = sim.trendStartPrice + trendAmount + noise;
      
      // To make it look smoother, we interpolate from last price
      // but for 1s updates, just adding the noise to current price is enough
      let newPrice = currentPrice + noise + (sim.trendDirection * sim.basePrice * (0.08 / sim.trendDuration * 1000));
      
      // Realistic bounds: ±15% from base price
      const minPrice = sim.basePrice * 0.85;
      const maxPrice = sim.basePrice * 1.15;
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      
      if (newPrice <= 0.01) {
        newPrice = 0.01;
      }
      
      updatedPrices[asset.symbol] = parseFloat(newPrice.toFixed(2));
      sim.lastPrice = newPrice;
    });
    
    if (Object.keys(updatedPrices).length > 0) {
        state.updateLivePrices(updatedPrices);
    }
}

function startLivePriceSimulator() {
  if (typeof window === 'undefined') return;
  
  // Robust singleton check using the global window object, immune to Fast Refresh
  if ((window as any).isBullRunSimulationRunning) {
    return;
  }
  (window as any).isBullRunSimulationRunning = true;
  
  console.log("Starting high-frequency real-time price simulator (1s updates)...");

  // Initial update
  const allAssets = useAssetPriceStore.getState().assets;
  
  // High-frequency timer (every 1 second for all assets)
  // This makes the UI feel alive
  const highFreqTimer = setInterval(() => {
    const assets = useAssetPriceStore.getState().assets;
    updateAssetGroup(assets, true);
  }, 1000); 

  // Return cleanup function
  return () => {
    clearInterval(highFreqTimer);
    (window as any).isBullRunSimulationRunning = false;
  };
}
// --- End of Singleton Price Simulator ---


export function useAssetPrices() {
  const assets = useAssetPriceStore(state => state.assets);
  const updateLivePrices = useAssetPriceStore(state => state.updateLivePrices);
  const setAssets = useAssetPriceStore(state => state.setAssets);
  const storeIsLoading = useAssetPriceStore(state => state.isLoading);
  const getAsset = useAssetPriceStore(state => state.getAsset);
  const getAssetHistory = useAssetPriceStore(state => state.getAssetHistory);
  const setAssetHistory = useAssetPriceStore(state => state.setAssetHistory);

  const { data: dbAssets, isLoading: isDbAssetsLoading } = useSWR<Asset[]>('/api/assets', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes (reduced from 60s)
    dedupingInterval: 60000, // Dedupe requests for 1 minute
    focusThrottleInterval: 300000, // Don't revalidate on focus more than once per 5 minutes
    revalidateOnFocus: false, // Don't revalidate on window focus
  });
  
  // Real-time anchor: Fetch actual market prices every 30 seconds
  const symbols = useMemo(() => dbAssets?.map(a => a.symbol).join(',') || '', [dbAssets]);
  const { data: realQuotes } = useSWR(
    symbols ? `/api/assets/batch-quotes?symbols=${symbols}` : null,
    fetcher,
    { refreshInterval: 30000 } // Update real prices every 30 seconds
  );

  useEffect(() => {
    if (realQuotes) {
      updateLivePrices(Object.fromEntries(
        Object.entries(realQuotes).map(([symbol, data]: [string, any]) => [symbol, data.price])
      ));
    }
  }, [realQuotes, updateLivePrices]);

  useEffect(() => {
    // Load assets from database and start price simulation
    if (dbAssets && dbAssets.length > 0 && assets.length === 0) {
      setAssets(dbAssets);
      startLivePriceSimulator();
    }
  }, [dbAssets, assets.length, setAssets]);
  
  return { 
    assets, 
    updateLivePrices, 
    setAssets, 
    isLoading: storeIsLoading || isDbAssetsLoading,
    getAsset,
    getAssetHistory,
    setAssetHistory,
  };
}

// Hook to fetch price history for a specific asset
export function useAssetHistory(symbol: string, range: string = '1D') {
  const getAssetHistory = useAssetPriceStore(state => state.getAssetHistory);
  const setAssetHistory = useAssetPriceStore(state => state.setAssetHistory);
  const cachedHistory = useAssetPriceStore(state => state.assetHistoryCache[symbol]);
  
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
      setAssetHistory(symbol, data);
    }
  }, [data, symbol, setAssetHistory]);

  return {
    data: cachedHistory || data || [],
    isLoading,
    error,
  };
}
