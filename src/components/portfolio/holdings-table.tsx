'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Holding } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';

export function HoldingsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const portfolioRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'portfolios', 'simulated');
  }, [user, firestore]);

  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc(portfolioRef);

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

  const enrichedHoldings = holdings.map((holding: any) => {
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
    return <p className="text-muted-foreground">You have no holdings in this portfolio.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead className="text-right">Avg. Buy Price</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
          <TableHead className="text-right">Total P/L (%)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrichedHoldings.map((holding: any) => (
          <TableRow key={holding.assetSymbol}>
            <TableCell className="font-medium">{holding.assetSymbol}</TableCell>
            <TableCell>{holding.quantity.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono">
              ${holding.avgBuyPrice.toFixed(2)}
            </TableCell>
            <TableCell className="text-right font-mono">
              ${holding.currentValue.toFixed(2)}
            </TableCell>
            <TableCell
              className={`text-right font-mono ${
                holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              } dark:${holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {holding.totalPL.toFixed(2)} ({holding.changePercent.toFixed(2)}%)
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
