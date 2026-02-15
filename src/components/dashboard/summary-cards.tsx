'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, Briefcase, Gift, Plus } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { useAssetPrices } from '@/hooks/use-asset-prices';
import { useSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function SummaryCards() {
  const { data: session } = useSession();
  const { assets, isLoading: areAssetsLoading } = useAssetPrices();
  const { toast } = useToast();
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const { data: userData, isLoading: isUserLoading } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  );

  const { data: portfolioData, isLoading: isPortfolioLoading } = useSWR(
    session?.user?.id ? `/api/users/${session.user.id}/portfolio` : null,
    fetcher
  );

  const { data: bonusData } = useSWR(
    session?.user?.id ? `/api/users/${session.user.id}/claim-daily-bonus` : null,
    fetcher,
    { refreshInterval: 60000 } // Check every minute
  );

  const handleClaimBonus = async () => {
    if (!session?.user?.id || !session?.user?.email) return;

    setIsClaimingBonus(true);
    try {
      const response = await fetch(`/api/users/${session.user.email}/claim-daily-bonus`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Daily Bonus Claimed!',
          description: data.message,
        });
        
        // Optimistically update the bonus data to show it's claimed
        const nextBonusTime = new Date();
        nextBonusTime.setDate(nextBonusTime.getDate() + 1);
        nextBonusTime.setHours(0, 0, 0, 0);
        
        const updatedBonusData = {
          canClaim: false,
          bonusAmount: 1000,
          lastClaimedDate: new Date(),
          nextBonusAvailable: nextBonusTime,
        };
        
        // Immediately update local SWR cache
        mutate(
          `/api/users/${session.user.email}/claim-daily-bonus`,
          updatedBonusData,
          false
        );
        
        // Also revalidate user data
        mutate(`/api/users/${session.user.email}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Already Claimed',
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to claim daily bonus',
      });
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const handleAddFunds = async () => {
    if (!session?.user?.id) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than $0.',
      });
      return;
    }

    if (amount > 100000) {
      toast({
        variant: 'destructive',
        title: 'Amount Too Large',
        description: 'Maximum deposit is $100,000 per transaction.',
      });
      return;
    }

    setIsAddingFunds(true);
    try {
      const response = await fetch(`/api/users/${session.user.email}/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add funds');
      }

      const data = await response.json();
      
      // Revalidate user data
      mutate(`/api/users/${session.user.email}`);

      toast({
        title: 'Funds Added Successfully',
        description: `$${amount.toLocaleString()} has been added to your account. New balance: $${data.newBalance.toLocaleString()}`,
      });

      setFundAmount('');
      setIsAddFundsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Funds',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsAddingFunds(false);
    }
  };

  const { portfolioValue, totalCost, totalPL, totalPLPercent } = useMemo(() => {
    const holdings = portfolioData?.holdings || [];
    if (holdings.length === 0 || assets.length === 0) {
        return { portfolioValue: 0, totalCost: 0, totalPL: 0, totalPLPercent: 0 };
    }

    let currentPortfolioValue = 0;
    let currentTotalCost = 0;

    holdings.forEach((holding: { assetSymbol: string; quantity: number; avgBuyPrice: number }) => {
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
          <div className="space-y-4">
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
      value: userData?.cashBalance || 0,
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      isCurrency: true,
      showAddFunds: true,
    },
    {
      title: 'Total Invested',
      value: totalCost,
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      isCurrency: true,
    }
  ];

  return (
    <div className="space-y-6">
      {bonusData?.canClaim && (
        <Card className="relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl glow-success">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 backdrop-blur-sm">
                <Gift className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Daily Bonus Available!</p>
                <p className="text-sm text-muted-foreground/80">Claim your $1,000 daily login reward</p>
              </div>
            </div>
            <Button 
              onClick={handleClaimBonus}
              disabled={isClaimingBonus}
              className="rounded-lg bg-green-600/90 hover:bg-green-600 text-white shadow-lg transition-all duration-200"
            >
              {isClaimingBonus ? 'Claiming...' : 'Claim $1,000'}
            </Button>
          </CardContent>
        </Card>
      )}

      {bonusData && !bonusData.canClaim && bonusData.nextBonusAvailable && (
        <Card className="relative overflow-hidden border-border/30 bg-card/20 backdrop-blur-xl">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 backdrop-blur-sm">
                <Gift className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Daily Bonus Claimed</p>
                <p className="text-sm text-muted-foreground/60">
                  Come back tomorrow for your next $1,000 reward
                </p>
              </div>
            </div>
            <Button 
              disabled
              variant="outline"
              className="rounded-lg opacity-40 cursor-not-allowed border-border/30"
            >
              Claimed Today
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
      {summaryData.map((item, index) => (
        <Card key={index} className={`group hover-lift stagger-fade-in stagger-${index + 1} cursor-pointer overflow-hidden relative`}>
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wide">{item.title}</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 backdrop-blur-sm group-hover:bg-muted/50 group-hover:scale-110 transition-all duration-300">
              {item.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tighter number-display value-transition bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {item.isCurrency && <span className="text-2xl font-semibold opacity-70">$</span>}
              {(item.value || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {item.change !== undefined && item.changePercent !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  item.change >= 0 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  <span className="text-sm">{item.change >= 0 ? '↗' : '↘'}</span>
                  <span>
                    {item.change >= 0 ? '+' : ''}
                    {(item.change || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground/60 font-medium">
                  {(item.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            )}
            {item.showAddFunds && (
              <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Virtual Funds</DialogTitle>
                    <DialogDescription>
                      Add simulated cash to your trading account. Current balance: ${(userData?.cashBalance || 0).toLocaleString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        disabled={isAddingFunds}
                        min="1"
                        max="100000"
                        step="100"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum $100,000 per transaction
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFundAmount('1000')}
                        disabled={isAddingFunds}
                      >
                        $1,000
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFundAmount('5000')}
                        disabled={isAddingFunds}
                      >
                        $5,000
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFundAmount('10000')}
                        disabled={isAddingFunds}
                      >
                        $10,000
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFundAmount('50000')}
                        disabled={isAddingFunds}
                      >
                        $50,000
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddFundsOpen(false)}
                      disabled={isAddingFunds}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddFunds} disabled={isAddingFunds}>
                      {isAddingFunds ? 'Adding...' : 'Add Funds'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
