'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Asset } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssetPrices } from '@/hooks/use-asset-prices';

export function Watchlist() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const watchlistSymbols = useMemo(() => userData?.watchlist || [], [userData]);
  
  const watchedAssets = useMemo(() => {
    return assets
      .filter(asset => watchlistSymbols.includes(asset.symbol))
      .slice(0, 5); // Limit to 5 for dashboard view
  }, [watchlistSymbols, assets]);


  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className='space-y-1'>
            <CardTitle className="text-sm font-medium">My Watchlist</CardTitle>
        </div>
        <Star className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isUserLoading || areAssetsLoading ? (
          renderSkeleton()
        ) : watchedAssets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Your watchlist is empty.</p>
            <Button asChild variant="outline" size="sm">
                <Link href="/trade">Add Assets</Link>
            </Button>
          </div>
        ) : (
            <div className='space-y-4'>
                {watchedAssets.map((asset) => {
                    const price = asset.price || 0;
                    const changePercent = asset.changePercent || 0;
                    return (
                        <Link href={`/trade/${asset.symbol}`} key={asset.symbol} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div className='flex items-center gap-4'>
                                <div className='font-bold text-sm'>{asset.symbol}</div>
                                <div>
                                    <div className='text-sm font-medium'>{asset.name}</div>
                                </div>
                            </div>
                            <div className='text-right'>
                                <div className='font-mono text-sm font-medium'>${price.toFixed(2)}</div>
                                <div className={cn("text-xs font-mono flex items-center justify-end gap-1", changePercent >= 0 ? 'text-green-600' : 'text-red-600')}>
                                    {changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {changePercent.toFixed(2)}%
                                </div>
                            </div>
                        </Link>
                    )
                })}
                 <Button asChild variant="outline" className="w-full mt-2">
                    <Link href="/watchlist">View All</Link>
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
