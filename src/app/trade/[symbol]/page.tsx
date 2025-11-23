
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
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { checkAndAwardBadges } from '@/lib/badge-service';
import { Skeleton } from '@/components/ui/skeleton';

type Duration = '6H' | '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL';

export default function TradePage() {
  const params = useParams();
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : '';
  
  const { getAsset, isLoading: areAssetsLoading, getAssetHistory } = useAssetPrices();
  const asset = useMemo(() => getAsset(symbol), [getAsset, symbol]);
  
  const [viewPriceHistory, setViewPriceHistory] = useState<PriceData[]>([]);
  const [quantity, setQuantity] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [duration, setDuration] = useState<Duration>('1D');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const { watchlist, toggleWatchlist } = useWatchlist();
  const isWatched = useMemo(() => watchlist.includes(symbol), [watchlist, symbol]);

  const livePrice = asset?.price || 0;
  
  useEffect(() => {
    if (!asset) return;

    const allPriceHistory = getAssetHistory(asset.symbol);
    if (!allPriceHistory || allPriceHistory.length === 0) return;
    
    const now = new Date().getTime();
    let historySlice: PriceData[] = [];
    
    const getFilteredData = (startTime: number, fullHistory: PriceData[]) => {
        return fullHistory.filter(p => p.time >= startTime);
    };

    const downsampleData = (data: PriceData[], maxPoints: number) => {
      if (data.length <= maxPoints) return data;
      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, i) => i % step === 0 || i === data.length - 1);
    }

    switch (duration) {
      case '6H':
        historySlice = getFilteredData(now - 6 * 60 * 60 * 1000, allPriceHistory); 
        break;
      case '1D': 
        historySlice = downsampleData(getFilteredData(now - 24 * 60 * 60 * 1000, allPriceHistory), 288); // 1 point every 5 mins
        break;
      case '1W': 
        historySlice = downsampleData(getFilteredData(now - 7 * 24 * 60 * 60 * 1000, allPriceHistory), 168); // ~1 point per hour
        break;
      case '1M': 
        historySlice = downsampleData(getFilteredData(now - 30 * 24 * 60 * 60 * 1000, allPriceHistory), 120); // ~4 points per day
        break;
      case '1Y': 
        historySlice = downsampleData(getFilteredData(now - 365 * 24 * 60 * 60 * 1000, allPriceHistory), 104); // ~2 points per week
        break;
      case '5Y': 
        historySlice = downsampleData(getFilteredData(now - 5 * 365 * 24 * 60 * 60 * 1000, allPriceHistory), 130); // ~1 point per 2 weeks
        break;
      case 'ALL': 
        historySlice = downsampleData(allPriceHistory, 200); 
        break;
    }
    
    const relevantHistory = historySlice.filter(p => p.time < now);
    const lastPoint = { time: now, price: livePrice };

    if (relevantHistory.length > 0) {
      if (relevantHistory[relevantHistory.length - 1].time !== lastPoint.time) {
        setViewPriceHistory([...relevantHistory, lastPoint]);
      } else {
        setViewPriceHistory(relevantHistory);
      }
    } else {
      const firstAvailablePoint = allPriceHistory.find(p => p.time < now) || { time: now - 86400000, price: asset.initialPrice };
      setViewPriceHistory([ firstAvailablePoint, lastPoint ]);
    }
    
  }, [asset, duration, getAssetHistory, livePrice]);


  if (areAssetsLoading) {
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
  
  if (!asset) {
    notFound();
  }

  const handleTrade = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to trade.' });
      return;
    }

    const tradeQuantity = parseFloat(quantity);
    if (isNaN(tradeQuantity) || tradeQuantity <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity.' });
      return;
    }

    const totalCost = tradeQuantity * livePrice;
    const userDocRef = doc(firestore, 'users', user.uid);
    const portfolioDocRef = doc(firestore, 'users', user.uid, 'portfolios', 'simulated');
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        const portfolioDoc = await transaction.get(portfolioDocRef);

        if (!userDoc.exists()) {
          throw new Error("User document does not exist.");
        }

        const userData = userDoc.data();
        let currentBalance = userData.walletSimulated;

        if (activeTab === 'buy') {
          if (currentBalance < totalCost) {
            throw new Error("Insufficient funds to complete this purchase.");
          }
          currentBalance -= totalCost;
        }

        let newHoldings = [];
        const existingHoldings = portfolioDoc.exists() ? portfolioDoc.data().holdings : [];
        let assetFound = false;
        
        if(activeTab === 'buy') {
            newHoldings = existingHoldings.map((h: any) => {
                if(h.assetSymbol === asset.symbol) {
                    assetFound = true;
                    const newQuantity = h.quantity + tradeQuantity;
                    const newAvgBuyPrice = ((h.avgBuyPrice * h.quantity) + totalCost) / newQuantity;
                    return { ...h, quantity: newQuantity, avgBuyPrice: newAvgBuyPrice };
                }
                return h;
            });

            if(!assetFound) {
                newHoldings.push({
                    assetSymbol: asset.symbol,
                    quantity: tradeQuantity,
                    avgBuyPrice: livePrice,
                });
            }
        } else { // Sell logic
            let assetSold = false;
            newHoldings = existingHoldings.map((h: any) => {
                if(h.assetSymbol === asset.symbol) {
                    assetSold = true;
                    if(h.quantity < tradeQuantity) {
                        throw new Error('You cannot sell more than you own.');
                    }
                    currentBalance += totalCost;
                    return { ...h, quantity: h.quantity - tradeQuantity };
                }
                return h;
            }).filter((h: any) => h.quantity > 0); // Remove asset if all sold
            if(!assetSold) {
                throw new Error("You do not own this asset to sell.");
            }
        }
        
        transaction.update(userDocRef, { walletSimulated: currentBalance });
        
        const portfolioData = {
          userId: user.uid,
          mode: 'simulated',
          holdings: newHoldings
        };

        if (portfolioDoc.exists()) {
          transaction.update(portfolioDocRef, { holdings: newHoldings });
        } else {
          transaction.set(portfolioDocRef, portfolioData);
        }
        
        const tradeData = {
            userId: user.uid,
            mode: 'simulated',
            assetSymbol: asset.symbol,
            assetType: asset.type,
            quantity: tradeQuantity,
            orderType: activeTab,
            price: livePrice,
            totalAmount: totalCost,
            timestamp: serverTimestamp(),
        };
        
        const tradesCollectionRef = collection(firestore, 'users', user.uid, 'trades');
        addDocumentNonBlocking(tradesCollectionRef, tradeData);
      });

      toast({
        title: 'Trade Successful',
        description: `Your order to ${activeTab} ${tradeQuantity} ${asset.symbol} has been executed.`,
      });
      
      await checkAndAwardBadges(firestore, user.uid, toast);

      setQuantity('');
      router.push('/portfolio');

    } catch (e: any) {
      console.error("Trade failed:", e);
      toast({
        variant: 'destructive',
        title: 'Trade Failed',
        description: e.message || 'An unexpected error occurred.',
      });
    }
  };
  
  const estimatedTotal = (parseFloat(quantity) || 0) * livePrice;
  const startPrice = viewPriceHistory.length > 1 ? viewPriceHistory[0].price : asset.initialPrice;
  const changePercent = startPrice > 0 ? ((livePrice - startPrice) / startPrice) * 100 : 0;
  const isPositiveChange = changePercent >= 0;

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
                 <StockChart data={viewPriceHistory} isPositive={isPositiveChange} duration={duration} />
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
                    <Label htmlFor="quantity-buy">Quantity</Label>
                    <Input id="quantity-buy" type="number" placeholder="0.00" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Total</Label>
                    <div className="text-2xl font-bold font-mono">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <Button className="w-full" onClick={handleTrade}>Place Buy Order</Button>
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
                  <Button className="w-full" variant="destructive" onClick={handleTrade}>Place Sell Order</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
