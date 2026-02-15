'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown, X } from 'lucide-react';
import { StockChart } from '@/components/charts/stock-chart';
import Link from 'next/link';
import type { Asset, PriceData } from '@/lib/types';
import useSWR from 'swr';

interface WatchlistComparisonProps {
  watchedAssets: Asset[];
  onClose?: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function WatchlistComparison({ watchedAssets, onClose }: WatchlistComparisonProps) {
  const [chartData, setChartData] = useState<Record<string, PriceData[]>>({});

  useEffect(() => {
    // Fetch price history for each asset
    const fetchData = async () => {
      const data: Record<string, PriceData[]> = {};
      
      for (const asset of watchedAssets) {
        try {
          const response = await fetch(`/api/price-history?symbol=${asset.symbol}&range=1D`);
          const priceHistory = await response.json();
          data[asset.symbol] = priceHistory;
        } catch (error) {
          console.error(`Failed to fetch price history for ${asset.symbol}:`, error);
          data[asset.symbol] = [];
        }
      }
      
      setChartData(data);
    };
    
    fetchData();
  }, [watchedAssets]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Asset Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of selected assets</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-6 ${watchedAssets.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {watchedAssets.map((asset) => (
            <div key={asset.symbol} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{asset.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{asset.name}</p>
                </div>
                <Badge variant={asset.type === 'crypto' ? 'secondary' : 'outline'}>
                  {asset.type}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-3xl font-black number-display">
                  ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">24h Change</p>
                <div className={`flex items-center gap-2 ${asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-xl font-bold">{asset.changePercent.toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-lg font-semibold">
                  ${(asset.marketCap / 1_000_000_000).toFixed(2)}B
                </p>
              </div>

              <div className="h-48 w-full">
                {chartData[asset.symbol] && chartData[asset.symbol].length > 0 ? (
                  <StockChart
                    data={chartData[asset.symbol]}
                    isPositive={asset.changePercent >= 0}
                    duration="1D"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading chart...
                  </div>
                )}
              </div>

              <Button asChild className="w-full">
                <Link href={`/trade/${asset.symbol}`}>
                  Trade {asset.symbol}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
