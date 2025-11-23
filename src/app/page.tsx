'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { Watchlist } from '@/components/dashboard/watchlist';
import { RecentTrades } from '@/components/dashboard/recent-trades';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Market Dashboard</h1>
      <SummaryCards />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <MarketOverview />
              </CardContent>
            </Card>
            <RecentTrades />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6">
            <AiInsights />
            <Watchlist />
          </div>
        </div>
      </div>
    </div>
  );
}

    