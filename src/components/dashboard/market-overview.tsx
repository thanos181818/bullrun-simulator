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
import { useMemo } from 'react';

type AssetTypeFilter = 'all' | 'stock' | 'crypto';

interface MarketOverviewProps {
  filter?: AssetTypeFilter;
}

export function MarketOverview({ filter = 'all' }: MarketOverviewProps) {
  const { assets, isLoading } = useAssetPrices();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const router = useRouter();

  const handleRowClick = (symbol: string) => {
    router.push(`/trade/${symbol}`);
  };

  const filteredAssets = useMemo(() => {
    if (filter === 'all') return assets;
    return assets.filter(asset => asset.type === filter);
  }, [assets, filter]);

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
    <div className="space-y-4">
      <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="w-12"></TableHead>
          <TableHead className="font-semibold">Symbol</TableHead>
          <TableHead className="font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Type</TableHead>
          <TableHead className="text-right font-semibold">Price</TableHead>
          <TableHead className="text-right font-semibold">Change</TableHead>
          <TableHead className="text-right font-semibold">Market Cap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAssets.map((asset, index) => {
          const isWatched = watchlist.includes(asset.symbol);
          return (
            <TableRow
              key={asset.symbol}
              onClick={() => handleRowClick(asset.symbol)}
              className="border-border/30 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/10 hover:via-purple-500/5 hover:to-transparent group cursor-pointer hover:scale-[1.01] hover:shadow-lg"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TableCell onClick={(e) => { e.stopPropagation(); toggleWatchlist(asset.symbol); }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:scale-125 hover:rotate-12 transition-all duration-300"
                  title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Star className={cn("h-4 w-4 transition-all duration-300", isWatched ? "fill-yellow-400 text-yellow-500 scale-110 animate-glow-pulse" : "text-muted-foreground group-hover:text-yellow-400")} />
                </Button>
              </TableCell>
              <TableCell className="font-bold text-base group-hover:text-primary transition-colors duration-300">{asset.symbol}</TableCell>
              <TableCell className="text-muted-foreground/90 group-hover:text-foreground transition-colors duration-300">{asset.name}</TableCell>
              <TableCell>
                <Badge variant={asset.type === 'crypto' ? 'secondary' : 'outline'} className="rounded-lg font-medium group-hover:scale-110 transition-transform duration-300">
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold number-display text-base group-hover:text-primary transition-colors duration-300">
                <span className="text-xs text-muted-foreground/60">$</span>
                {(asset.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </TableCell>
              <TableCell className="text-right">
                <div className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-bold shadow-md transition-all duration-300 group-hover:scale-110 ${
                  asset.changePercent >= 0 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 shadow-green-500/20' 
                    : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 shadow-red-500/20'
                }`}>
                  <span className="text-base">{asset.changePercent >= 0 ? '↗' : '↘'}</span>
                  <span className="number-display">{(asset.changePercent || 0).toFixed(2)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground/80 font-medium number-display">
                ${((asset.marketCap || 0) / 1_000_000_000).toFixed(2)}B
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    </div>
  );
}
