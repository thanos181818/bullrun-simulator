'use client';

import React from 'react';
import { LightweightChart } from './lightweight-chart';
import type { PriceData } from '@/lib/types';

type Duration = '6H' | '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL';

interface StockChartProps {
  data: PriceData[];
  isPositive: boolean;
  duration: Duration;
}

export function StockChart({ data, isPositive }: StockChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/50">
        <p className="text-sm text-muted-foreground animate-pulse">Loading market data...</p>
      </div>
    );
  }

  // Convert PriceData[] to format expected by LightweightChart
  const chartData = data.map(item => ({
    time: item.time,
    value: item.price
  }));

  return (
    <div className="h-full w-full min-h-[300px]">
      <LightweightChart data={chartData} isPositive={isPositive} />
    </div>
  );
}
