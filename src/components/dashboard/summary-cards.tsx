'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, Briefcase } from 'lucide-react';
import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';

export function SummaryCards() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const portfolioRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'portfolios', 'simulated');
  }, [user, firestore]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);
  const { data: portfolioData, isLoading: isPortfolioLoading } = useDoc(portfolioRef);

  const { portfolioValue, totalCost, totalPL, totalPLPercent } = useMemo(() => {
    const holdings = portfolioData?.holdings || [];
    if (holdings.length === 0 || assets.length === 0) {
        return { portfolioValue: 0, totalCost: 0, totalPL: 0, totalPLPercent: 0 };
    }

    let currentPortfolioValue = 0;
    let currentTotalCost = 0;

    holdings.forEach((holding: any) => {
      const asset = assets.find(a => a.symbol === holding.assetSymbol);
      if (asset && asset.price) {
        currentPortfolioValue += holding.quantity * asset.price;
        currentTotalCost += holding.quantity * holding.avgBuyPrice;
      }
    });
    
    const pl = currentPortfolioValue - currentTotalCost;
    const plPercent = currentTotalCost > 0 ? (pl / currentTotalCost) * 100 : 0;

    return { 
        portfolioValue: currentPortfolioValue, 
        totalCost: currentTotalCost, 
        totalPL: pl, 
        totalPLPercent: plPercent 
    };
  }, [portfolioData, assets]);

  if (isUserLoading || isPortfolioLoading || areAssetsLoading) {
      return (
          <div className="grid gap-4 md:grid-cols-3">
              <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'><CardTitle className="text-sm font-medium">Simulated Portfolio Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
              </Card>
              <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'><CardTitle className="text-sm font-medium">Simulated Cash Balance</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
              </Card>
              <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'><CardTitle className="text-sm font-medium">Total Invested</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
              </Card>
          </div>
      )
  }

  const summaryData = [
    {
      title: 'Simulated Portfolio Value',
      value: portfolioValue,
      change: totalPL,
      changePercent: totalPLPercent,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      isCurrency: true,
    },
    {
      title: 'Simulated Cash Balance',
      value: userData?.walletSimulated || 0,
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      isCurrency: true,
    },
    {
      title: 'Total Invested',
      value: totalCost,
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      isCurrency: true,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.isCurrency ? '$' : ''}
              {(item.value || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {item.change !== undefined && item.changePercent !== undefined && (
              <p
                className={`text-xs ${
                  item.change >= 0 ? 'text-green-600' : 'text-red-600'
                } dark:${
                  item.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {item.change >= 0 ? '+' : ''}
                {(item.change || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ({(item.changePercent || 0).toFixed(2)}%) Total
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
