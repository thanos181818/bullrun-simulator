import { create } from 'zustand';

interface AssetPriceState {
  prices: Record<string, number>;
  previousPrices: Record<string, number>;
  lastUpdated: number | null;
  setPrices: (newPrices: Record<string, number>) => void;
  getPrice: (symbol: string) => number | null;
}

export const useAssetPriceStore = create<AssetPriceState>((set, get) => ({
  prices: {},
  previousPrices: {},
  lastUpdated: null,

  setPrices: (newPrices) =>
    set((state) => ({
      previousPrices: { ...state.prices },
      prices: newPrices,
      lastUpdated: Date.now(),
    })),

  getPrice: (symbol) => get().prices[symbol] ?? null,
}));

// --- Sliced Selectors ---

export const selectPrice = (symbol: string) =>
  (state: AssetPriceState) => state.prices[symbol] ?? null;

export const selectPrevPrice = (symbol: string) =>
  (state: AssetPriceState) => state.previousPrices[symbol] ?? null;

export const selectAllPrices =
  (state: AssetPriceState) => state.prices;

export const selectLastUpdated =
  (state: AssetPriceState) => state.lastUpdated;

export const selectPriceDirection = (symbol: string) =>
  (state: AssetPriceState) => {
    const current = state.prices[symbol];
    const previous = state.previousPrices[symbol];
    if (!current || !previous || current === previous) return 'flat';
    return current > previous ? 'up' : 'down';
  };
