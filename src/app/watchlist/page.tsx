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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Asset } from '@/lib/types';
import { useWatchlist } from '@/hooks/use-watchlist';
import { Star, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { WatchlistComparison } from '@/components/dashboard/watchlist-comparison';


export default function WatchlistPage() {
  const { watchlist, isLoading: isWatchlistLoading, toggleWatchlist } = useWatchlist();
  const { assets: allAssets, isLoading: areAssetsLoading } = useAssetPrices();
  const router = useRouter();
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const watchedAssets = useMemo(() => {
    return allAssets.filter(asset => watchlist.includes(asset.symbol));
  }, [allAssets, watchlist]);

  const handleRowClick = (symbol: string) => {
    if (selectedAssets.length === 0) {
      router.push(`/trade/${symbol}`);
    }
  };

  const toggleAssetSelection = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAssets.includes(symbol)) {
      setSelectedAssets(selectedAssets.filter(s => s !== symbol));
    } else if (selectedAssets.length < 3) {
      setSelectedAssets([...selectedAssets, symbol]);
    }
  };

  const handleCompare = () => {
    if (selectedAssets.length >= 2) {
      setShowComparison(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedAssets([]);
    setShowComparison(false);
  };

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Watchlist</h1>
        {selectedAssets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedAssets.length} selected (min 2, max 3)
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearSelection}
            >
              Clear
            </Button>
            {selectedAssets.length >= 2 && (
              <Button 
                size="sm"
                onClick={handleCompare}
              >
                Compare {selectedAssets.length} Assets
              </Button>
            )}
          </div>
        )}
      </div>
      
      {showComparison && selectedAssets.length >= 2 && (
        <WatchlistComparison 
          watchedAssets={watchedAssets.filter(asset => selectedAssets.includes(asset.symbol))}
          onClose={handleClearSelection}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Watched Assets</CardTitle>
          <CardDescription>A list of assets you are currently tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          {isWatchlistLoading || areAssetsLoading ? (
            renderSkeleton()
          ) : watchedAssets.length === 0 ? (
            <p className="text-muted-foreground">Your watchlist is empty. Add assets from the Trade page.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change (%)</TableHead>
                  <TableHead className="text-right">Market Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchedAssets.map((asset) => {
                  const price = asset.price || 0;
                  const changePercent = asset.changePercent || 0;
                  const marketCap = asset.marketCap || 0;
                  const isSelected = selectedAssets.includes(asset.symbol);

                  return (
                    <TableRow 
                      key={asset.symbol} 
                      onClick={() => handleRowClick(asset.symbol)} 
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <TableCell onClick={(e) => toggleAssetSelection(asset.symbol, e)}>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          title={isSelected ? 'Deselect for comparison' : 'Select for comparison'}
                          disabled={!isSelected && selectedAssets.length >= 3}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell onClick={(e) => { e.stopPropagation(); toggleWatchlist(asset.symbol); }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={'Remove from watchlist'}
                        >
                          <Star className={cn("h-4 w-4", "fill-yellow-400 text-yellow-500")} />
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
                        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        } dark:${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {changePercent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${(marketCap / 1_000_000_000).toFixed(2)}B
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
