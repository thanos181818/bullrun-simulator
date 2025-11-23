'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useWatchlist } from '@/hooks/use-watchlist';
import { cn } from '@/lib/utils';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { Skeleton } from '../ui/skeleton';

export function MarketOverview() {
  const { assets, isLoading } = useAssetPrices();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const router = useRouter();

  const handleRowClick = (symbol: string) => {
    router.push(`/trade/${symbol}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Change (%)</TableHead>
          <TableHead className="text-right">Market Cap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => {
          const isWatched = watchlist.includes(asset.symbol);
          return (
            <TableRow
              key={asset.symbol}
              onClick={() => handleRowClick(asset.symbol)}
              className="cursor-pointer"
            >
              <TableCell onClick={(e) => { e.stopPropagation(); toggleWatchlist(asset.symbol); }}>
                <Button
                  variant="ghost"
                  size="icon"
                  title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Star className={cn("h-4 w-4", isWatched ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
                </Button>
              </TableCell>
              <TableCell className="font-medium">{asset.symbol}</TableCell>
              <TableCell>{asset.name}</TableCell>
              <TableCell>
                <Badge variant={asset.type === 'crypto' ? 'secondary' : 'outline'}>
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                ${(asset.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
                  asset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                } dark:${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {(asset.changePercent || 0).toFixed(2)}%
              </TableCell>
              <TableCell className="text-right">
                ${((asset.marketCap || 0) / 1_000_000_000).toFixed(2)}B
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );
}
