'use client';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TradePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Trade</h1>
      <Card>
        <CardHeader>
          <CardTitle>Market</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketOverview />
        </CardContent>
      </Card>
    </div>
  );
}
