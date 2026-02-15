
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsTrigger,
  TabsList,
} from '@/components/ui/tabs';
import { StockChart } from '@/components/charts/stock-chart';
import type { Asset, PriceData } from '@/lib/types';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useAssetPrices, useAssetHistory } from '@/hooks/use-asset-prices';
import { Skeleton } from '@/components/ui/skeleton';
import { mutate } from 'swr';
import { checkAndAwardBadges } from '@/lib/badge-service';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Duration = '6H' | '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL';

export default function TradePage() {
  const params = useParams();
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : '';
  
  const { assets, getAsset, isLoading: areAssetsLoading } = useAssetPrices();
  const asset = useMemo(() => getAsset(symbol), [getAsset, symbol, assets]);
  
  const [quantity, setQuantity] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [duration, setDuration] = useState<Duration>('1D');
  const [isTrading, setIsTrading] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const { watchlist, toggleWatchlist } = useWatchlist();
  const isWatched = useMemo(() => watchlist.includes(symbol), [watchlist, symbol]);

  // Fetch user data to check balance
  const { data: userData } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  );

  // Fetch price history from MongoDB based on duration
  const { data: priceHistory, isLoading: isHistoryLoading } = useAssetHistory(symbol, duration);

  const livePrice = asset?.price || 0;
  
  // Prepare chart data: append current live price to history (MUST be before any returns)
  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      // If no history yet, show just the current price
      return [{ time: Date.now(), price: livePrice }];
    }
    
    // Append live price as the latest data point
    const now = Date.now();
    const lastHistoryPoint = priceHistory[priceHistory.length - 1];
    
    if (lastHistoryPoint && lastHistoryPoint.time < now - 60000) {
      // If last point is more than 1 minute old, append live price
      return [...priceHistory, { time: now, price: livePrice }];
    }
    
    return priceHistory;
  }, [priceHistory, livePrice]);
  
  const estimatedTotal = (parseFloat(quantity) || 0) * livePrice;
  const startPrice = chartData.length > 1 ? chartData[0].price : (asset?.initialPrice || livePrice);
  const changePercent = startPrice > 0 ? ((livePrice - startPrice) / startPrice) * 100 : 0;
  const isPositiveChange = changePercent >= 0;
  
  // Check if asset doesn't exist after loading completes
  useEffect(() => {
    if (!areAssetsLoading && asset) {
      // Asset loaded successfully, clear any 404 state
      setShowNotFound(false);
    } else if (!areAssetsLoading && !asset && symbol) {
      // Give a longer delay for assets to fully populate
      const timer = setTimeout(() => {
        // Get fresh asset value from store instead of using closure
        const freshAsset = getAsset(symbol);
        if (!freshAsset) {
          setShowNotFound(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [areAssetsLoading, asset, symbol, getAsset]);

  // Show 404 page if asset truly doesn't exist
  if (showNotFound) {
    notFound();
  }

  // Show loading skeleton while we wait for asset data
  const isStillLoading = areAssetsLoading || (!asset && !showNotFound);
  
  if (isStillLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-9 w-40" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-96 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  const handleTrade = async () => {
    if (!session?.user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to trade.' });
      return;
    }

    const tradeQuantity = parseFloat(quantity);
    if (isNaN(tradeQuantity) || tradeQuantity <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity.' });
      return;
    }

    const totalCost = tradeQuantity * livePrice;
    const userBalance = userData?.cashBalance || 0;

    // Client-side validation for buy orders
    if (activeTab === 'buy') {
      if (userBalance <= 0) {
        toast({ 
          variant: 'destructive', 
          title: 'Insufficient Balance', 
          description: 'You have no cash balance. Please add funds to your account.' 
        });
        return;
      }
      if (userBalance < totalCost) {
        toast({ 
          variant: 'destructive', 
          title: 'Insufficient Funds', 
          description: `You have $${userBalance.toFixed(2)} but need $${totalCost.toFixed(2)}.` 
        });
        return;
      }
    }

    setIsTrading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetSymbol: asset.symbol,
          assetType: asset.type,
          quantity: tradeQuantity,
          price: livePrice,
          orderType: activeTab,
          mode: 'simulated',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      // Revalidate all affected data
      mutate(`/api/users/${session.user.email}`); // User balance
      mutate(`/api/users/${session.user.id}/portfolio`); // Portfolio holdings
      mutate(`/api/users/${session.user.id}/trades`); // Trade history

      toast({
        title: 'Trade Successful',
        description: `Your order to ${activeTab} ${tradeQuantity} ${asset.symbol} has been executed.`,
      });

      // Check and award badges after successful trade
      if (session.user.email) {
        console.log('[TRADE] Checking badges after trade...');
        const newBadges = await checkAndAwardBadges(session.user.email, toast);
        console.log('[TRADE] Badge check complete, new badges:', newBadges);
      }

      setQuantity('');
      
      // Slight delay before navigation to ensure badge toasts show
      setTimeout(() => {
        router.push('/portfolio');
      }, 1000);

    } catch (e) {
      console.error("Trade failed:", e);
      toast({
        variant: 'destructive',
        title: 'Trade Failed',
        description: e.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsTrading(false);
    }
  };
  
  // If we don't have an asset yet but not loading, wait for it
  if (!asset && !areAssetsLoading && !showNotFound) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-9 w-40" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-96 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">
          {asset.name} ({asset.symbol})
        </h1>
        <Badge variant={asset.type === 'crypto' ? 'secondary' : 'outline'}>
          {asset.type}
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => toggleWatchlist(symbol)} title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}>
          <Star className={cn("h-5 w-5", isWatched ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-baseline gap-2">
                 <CardTitle className="text-3xl font-bold font-mono">
                  ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
                 <p className={cn("font-mono text-sm font-semibold", isPositiveChange ? 'text-green-600' : 'text-red-600')}>
                    {isPositiveChange ? '+' : ''}{changePercent.toFixed(2)}% ({duration})
                </p>
              </div>
              <CardDescription>Live Price Chart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-96 w-full'>
                 {isHistoryLoading ? (
                   <Skeleton className="h-full w-full" />
                 ) : (
                   <StockChart data={chartData} isPositive={isPositiveChange} duration={duration} />
                 )}
              </div>
              <div className="mt-4 flex justify-center">
                <ToggleGroup type="single" value={duration} onValueChange={(value: Duration) => value && setDuration(value)}>
                  {(['6H', '1D', '1W', '1M', '1Y', '5Y', 'ALL'] as Duration[]).map(d => (
                    <ToggleGroupItem key={d} value={d} aria-label={`Select ${d}`}>
                      {d}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Trade</CardTitle>
              <CardDescription>Execute buy or sell orders for {asset.symbol}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
                <TabsContent value="buy" className="mt-4 space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="quantity-buy">Quantity {asset.type === 'crypto' && <span className="text-xs text-muted-foreground">(fractional allowed)</span>}</Label>
                    <Input 
                      id="quantity-buy" 
                      type="number" 
                      placeholder={asset.type === 'crypto' ? '0.0000' : '0'} 
                      value={quantity} 
                      onChange={e => setQuantity(e.target.value)}
                      step={asset.type === 'crypto' ? '0.0001' : '1'}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Total</Label>
                    <div className="text-2xl font-bold font-mono">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <Button className="w-full" onClick={handleTrade} disabled={isTrading}>
                    {isTrading ? 'Executing...' : 'Place Buy Order'}
                  </Button>
                </TabsContent>
                 <TabsContent value="sell" className="mt-4 space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="quantity-sell">Quantity</Label>
                    <Input id="quantity-sell" type="number" placeholder="0.00" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Value</Label>
                    <div className="text-2xl font-bold font-mono">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <Button className="w-full" variant="destructive" onClick={handleTrade} disabled={isTrading}>
                    {isTrading ? 'Executing...' : 'Place Sell Order'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
