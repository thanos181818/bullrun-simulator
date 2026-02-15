'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { Watchlist } from '@/components/dashboard/watchlist';
import { RecentTrades } from '@/components/dashboard/recent-trades';
import { useState } from 'react';

type AssetTypeFilter = 'all' | 'stock' | 'crypto';

export default function DashboardPage() {
  const [filter, setFilter] = useState<AssetTypeFilter>('all');

  return (
    <div className="flex flex-col gap-8 animate-scale-in">
      <div className="stagger-fade-in stagger-1">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
          Market Dashboard
        </h1>
        <p className="text-muted-foreground/80 mt-2 text-base">
          Real-time overview of your portfolio and market activity
        </p>
      </div>
      <div className="stagger-fade-in stagger-2">
        <SummaryCards />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-6">
            <Card className="stagger-fade-in stagger-3 hover-lift" data-tour="market-overview">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Market Overview</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'stock' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filter === 'stock' ? 'all' : 'stock')}
                      className="font-medium transition-all duration-200"
                    >
                      Stocks
                    </Button>
                    <Button
                      variant={filter === 'crypto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filter === 'crypto' ? 'all' : 'crypto')}
                      className="font-medium transition-all duration-200"
                    >
                      Crypto
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MarketOverview filter={filter} />
              </CardContent>
            </Card>
            <div className="stagger-fade-in stagger-4">
              <RecentTrades />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6">
            <div className="stagger-fade-in stagger-3">
              <AiInsights />
            </div>
            <div className="stagger-fade-in stagger-4" data-tour="watchlist">
              <Watchlist />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

    