'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';

const chartConfigPie = {
  holdings: {
    label: 'Holdings',
  },
};

export function PortfolioCharts() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const portfolioRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'portfolios', 'simulated');
  }, [user, firestore]);

  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc(portfolioRef);

  const allocationData = useMemo(() => {
    if (!portfolio || !portfolio.holdings || assets.length === 0) return [];
    return portfolio.holdings.map((h: any, i: number) => {
        const asset = assets.find(a => a.symbol === h.assetSymbol);
        const currentValue = asset && asset.price ? h.quantity * asset.price : 0;
      return {
        name: h.assetSymbol,
        value: currentValue,
        fill: `hsl(var(--chart-${(i % 5) + 1}))`,
      }
    }).filter(d => d.value > 0);
  }, [portfolio, assets]);

  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
        {isPortfolioLoading || areAssetsLoading ? <Skeleton className="h-[200px] w-[200px] rounded-full" /> : 
          allocationData.length > 0 ? (
            <ChartContainer
              config={chartConfigPie}
              className="mx-auto aspect-square h-[200px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={allocationData} dataKey="value" nameKey="name" />
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground">No holdings to display.</p>
          )
          }
        </CardContent>
      </Card>
    </div>
  );
}
