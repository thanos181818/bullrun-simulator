'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function PortfolioCharts() {
  const { data: session } = useSession();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();

  const { data: portfolio, isLoading: isPortfolioLoading } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}/portfolio?mode=simulated` : null,
    fetcher
  );

  const { allocationData, chartConfig } = useMemo(() => {
    if (!portfolio || !portfolio.holdings || assets.length === 0) {
      return { allocationData: [], chartConfig: {} };
    }
    
    const data = portfolio.holdings
      .map((h: { assetSymbol: string; quantity: number; avgBuyPrice: number }, i: number) => {
        const asset = assets.find(a => a.symbol === h.assetSymbol);
        const currentValue = asset && asset.price ? h.quantity * asset.price : 0;
        return {
          name: h.assetSymbol,
          assetName: asset?.name || h.assetSymbol,
          value: currentValue,
          fill: CHART_COLORS[i % CHART_COLORS.length],
        };
      })
      .filter(d => d.value > 0);
    
    // Build config dynamically for proper labels
    const config: Record<string, { label: string }> = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.assetName,
      };
    });
    
    return { allocationData: data, chartConfig: config };
  }, [portfolio, assets]);

  const totalValue = useMemo(() => {
    return allocationData.reduce((sum, item) => sum + item.value, 0);
  }, [allocationData]);

  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          {isPortfolioLoading || areAssetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Skeleton className="h-[300px] w-[300px] rounded-full" />
            </div>
          ) : allocationData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[350px]"
            >
              <PieChart>
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      hideLabel 
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ({((Number(value) / totalValue) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    />
                  } 
                />
                <Pie 
                  data={allocationData} 
                  dataKey="value" 
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-background" />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-sm"
                            >
                              Total Value
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" className="text-foreground" />}
                  className="flex-wrap gap-3 pt-4"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No holdings to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
