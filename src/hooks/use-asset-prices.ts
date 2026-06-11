'use client';

import useSWR from 'swr';
import { useAssetPriceStore } from '@/stores/asset-price-store';
import { useMemo } from 'react';
import type { Asset, PriceData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Market data fetch failed: ${r.status}`);
  return r.json();
});

export function useAssetPrices() {
  const setPrices = useAssetPriceStore(state => state.setPrices);
  const prices = useAssetPriceStore(state => state.prices);
  const lastUpdated = useAssetPriceStore(state => state.lastUpdated);

  // 1. Fetch static asset metadata from DB (caching, names, types)
  const { data: dbAssets, isLoading: isDbLoading } = useSWR<Asset[]>(
    '/api/assets',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 2. Poll for live prices every 15s
  const { error, isLoading: isPricesLoading, isValidating } = useSWR(
    '/api/market/quotes',
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      onSuccess: (data) => {
        if (data?.prices) {
          setPrices(data.prices);
        }
      },
    }
  );

  // 3. Merge DB metadata with Live prices
  const mergedAssets = useMemo(() => {
    if (!dbAssets) return [];
    return dbAssets.map(asset => {
      const livePrice = prices[asset.symbol];
      if (!livePrice) return asset;

      // Calculate change based on initial price if live price exists
      const change = livePrice - asset.initialPrice;
      const changePercent = (change / asset.initialPrice) * 100;

      return {
        ...asset,
        price: livePrice,
        change,
        changePercent,
      };
    });
  }, [dbAssets, prices]);

  const getAsset = (sym: string) => {
    return mergedAssets.find(a => a.symbol === sym.toUpperCase());
  };

  return {
    assets: mergedAssets,
    getAsset,
    prices,
    isLoading: isDbLoading || isPricesLoading,
    isError: !!error,
    isRefreshing: isValidating && !isPricesLoading,
    lastUpdated,
  };
}

export function useAssetHistory(symbol: string, range: string = '1M') {
  const { data, error, isLoading, mutate } = useSWR<PriceData[]>(
    symbol ? `/api/price-history?symbol=${symbol}&range=${range}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    data: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useSingleQuote(symbol: string) {
  const { data, error, isLoading } = useSWR(
    symbol ? `/api/market/quote/${symbol}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    quote: data,
    isLoading,
    isError: !!error,
  };
}
