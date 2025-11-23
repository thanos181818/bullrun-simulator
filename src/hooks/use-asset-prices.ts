'use client';

import { useEffect, useMemo } from 'react';
import type { Asset, PriceData } from '@/lib/types';
import { create } from 'zustand';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, writeBatch, doc } from 'firebase/firestore';

function createSeededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function generateConsistentPriceHistory(symbol: string, initialPrice: number): PriceData[] {
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = createSeededRandom(seed);
    const now = Date.now();
    const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const history: PriceData[] = [];
    
    let currentTime = fiveYearsAgo;
    let lastPrice = initialPrice > 0 ? initialPrice : 1;

    // Generate daily data for old history
    while (currentTime < sevenDaysAgo) {
        const fluctuation = (seededRandom() - 0.5) * 0.1; 
        let newPrice = lastPrice * (1 + fluctuation);
        if (newPrice <= 0) newPrice = lastPrice * (1 + Math.abs(fluctuation));

        history.push({ time: currentTime, price: newPrice });
        lastPrice = newPrice;
        currentTime += 24 * 60 * 60 * 1000;
    }
    
    currentTime = sevenDaysAgo;
    // Generate hourly data for the last 7 days
    while (currentTime < now) {
        const fluctuation = (seededRandom() - 0.5) * 0.05; 
        let newPrice = lastPrice * (1 + fluctuation);
        if (newPrice <= 0) newPrice = lastPrice * (1 + Math.abs(fluctuation));

        history.push({ time: currentTime, price: newPrice });
        lastPrice = newPrice;
        currentTime += 60 * 60 * 1000; // Move to the next hour
    }

    return history;
}

interface AssetPriceStore {
  assets: Asset[];
  assetHistory: Record<string, PriceData[]>;
  isLoading: boolean;
  getAsset: (symbol: string) => Asset | undefined;
  getAssetHistory: (symbol: string) => PriceData[] | undefined;
  setAssets: (newAssets: Asset[]) => void;
  initializeHistory: (assets: Asset[]) => void;
  updateLivePrices: (priceUpdates: Record<string, number>) => void;
}

const useAssetPriceStore = create<AssetPriceStore>((set, get) => ({
  assets: [],
  assetHistory: {},
  isLoading: true,
  getAsset: (symbol: string) => get().assets.find(a => a.symbol === symbol),
  getAssetHistory: (symbol: string) => get().assetHistory[symbol],
  setAssets: (newAssets: Asset[]) => {
    const enrichedAssets = newAssets.map(asset => {
        const price = asset.price !== undefined ? asset.price : asset.initialPrice;
        const change = price - asset.initialPrice;
        const changePercent = asset.initialPrice > 0 ? (change / asset.initialPrice) * 100 : 0;
        return { ...asset, price, change, changePercent };
    });
    set({ assets: enrichedAssets, isLoading: false });
  },
  initializeHistory: (assets: Asset[]) => {
    if (Object.keys(get().assetHistory).length > 0) return;
    const history: Record<string, PriceData[]> = {};
    assets.forEach(asset => {
        history[asset.symbol] = generateConsistentPriceHistory(asset.symbol, asset.initialPrice);
    });
    set({ assetHistory: history });
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
      
      const newHistory = { ...state.assetHistory };
      Object.keys(priceUpdates).forEach(symbol => {
          if (newHistory[symbol]) {
              const currentHistory = newHistory[symbol];
              const lastTimestamp = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].time : 0;
              if (now > lastTimestamp) {
                  newHistory[symbol] = [...currentHistory, { time: now, price: priceUpdates[symbol] }];
              }
          }
      });

      return { assets: newAssets, assetHistory: newHistory };
    });
  },
}));

// --- Singleton Price Simulator ---

function updateAssetGroup(firestore: any, assets: Asset[]) {
    const state = useAssetPriceStore.getState();
    if (assets.length === 0 || state.isLoading) return;

    const batch = writeBatch(firestore);
    const updatedPrices: Record<string, number> = {};

    assets.forEach(asset => {
      const currentAsset = state.getAsset(asset.symbol);
      if (!currentAsset) return;

      const volatility = currentAsset.type === 'crypto' ? 0.001 : 0.0005;
      const rand = Math.random() - 0.5;
      let newPrice = (currentAsset.price || currentAsset.initialPrice) * (1 + rand * volatility);

      if (newPrice <= 0.01) {
        newPrice = 0.01;
      }
      
      updatedPrices[currentAsset.symbol] = newPrice;
      const assetRef = doc(firestore, 'assets', currentAsset.symbol);
      batch.update(assetRef, { price: newPrice });
    });
    
    if (Object.keys(updatedPrices).length > 0) {
        state.updateLivePrices(updatedPrices);
        batch.commit().catch(error => {
          console.error("Failed to write price updates to Firestore:", error);
           errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: 'assets',
              operation: 'update',
              requestResourceData: { note: 'Batch price update' },
            })
          );
        });
    }
}


function startLivePriceSimulator(firestore: any) {
  // Robust singleton check using the global window object, immune to Fast Refresh
  if ((window as any).isBullRunSimulationRunning) {
    console.log("Price simulation is already running.");
    return;
  }
  (window as any).isBullRunSimulationRunning = true;
  
  console.log("Starting the throttled price simulation timers...");

  const allAssets = useAssetPriceStore.getState().assets;
  const highFrequencyAssets = allAssets.slice(0, 5);
  const lowFrequencyAssets = allAssets.slice(5);

  // High-frequency timer (every 1 minute)
  setInterval(() => {
    updateAssetGroup(firestore, highFrequencyAssets);
  }, 60 * 1000); 

  // Low-frequency timer (every 10 minutes)
  setInterval(() => {
    updateAssetGroup(firestore, lowFrequencyAssets);
  }, 10 * 60 * 1000);
}
// --- End of Singleton Price Simulator ---


export function useAssetPrices() {
  const store = useAssetPriceStore();
  const firestore = useFirestore();

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assets'));
  }, [firestore]);

  const { data: dbAssets, isLoading: isDbAssetsLoading } = useCollection<Asset>(assetsQuery);
  
  useEffect(() => {
    // This effect runs once when dbAssets are loaded.
    // It sets the initial state and starts the simulation timers.
    if (dbAssets && dbAssets.length > 0 && store.assets.length === 0) { // Only run if assets are not already in store
      store.setAssets(dbAssets);
      store.initializeHistory(dbAssets);
      if (firestore) {
        startLivePriceSimulator(firestore);
      }
    }
  }, [dbAssets, firestore, store]);
  
  return { ...store, isLoading: store.isLoading || isDbAssetsLoading };
}
