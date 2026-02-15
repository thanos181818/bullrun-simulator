'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Holding } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function HoldingsTable() {
  const { data: session } = useSession();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const { data: portfolio, isLoading: isPortfolioLoading } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}/portfolio?mode=simulated` : null,
    fetcher
  );

  if (isPortfolioLoading || areAssetsLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div className="flex items-center space-x-4" key={i}>
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const holdings = portfolio?.holdings || [];

  const enrichedHoldings = holdings.map((holding: { assetSymbol: string; quantity: number; avgBuyPrice: number }) => {
    const asset = assets.find(a => a.symbol === holding.assetSymbol);
    if (!asset || !asset.price) return null;

    const currentValue = holding.quantity * asset.price;
    const totalCost = holding.quantity * holding.avgBuyPrice;
    const changePercent = totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0;
    const totalPL = currentValue - totalCost;

    return {
      ...holding,
      currentValue,
      changePercent,
      totalPL,
    };
  }).filter(Boolean);

  if (enrichedHoldings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted/30 p-6 mb-4">
          <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-muted-foreground">No holdings yet</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Start trading to build your portfolio</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="font-semibold">Symbol</TableHead>
          <TableHead className="font-semibold">Quantity</TableHead>
          <TableHead className="text-right font-semibold">Avg. Buy Price</TableHead>
          <TableHead className="text-right font-semibold">Current Value</TableHead>
          <TableHead className="text-right font-semibold">Total P/L</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrichedHoldings.map((holding, index) => (
          <TableRow 
            key={holding.assetSymbol}
            className="border-border/30 transition-all duration-200 hover:bg-accent/20 group cursor-pointer"
          >
            <TableCell className="font-bold text-base">{holding.assetSymbol}</TableCell>
            <TableCell className="number-display font-semibold">{holding.quantity.toLocaleString()}</TableCell>
            <TableCell className="text-right number-display font-medium">
              <span className="text-xs text-muted-foreground/60">$</span>
              {holding.avgBuyPrice.toFixed(2)}
            </TableCell>
            <TableCell className="text-right number-display font-bold text-base">
              <span className="text-xs text-muted-foreground/60">$</span>
              {holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col items-end gap-1">
                <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
                  holding.changePercent >= 0 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  <span className="text-base">{holding.changePercent >= 0 ? '\u2197' : '\u2198'}</span>
                  <span className="number-display">
                    {holding.totalPL >= 0 ? '+' : ''}${Math.abs(holding.totalPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground/60 font-medium">
                  {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
