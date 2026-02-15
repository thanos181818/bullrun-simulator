'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, TrendingDown, Gift, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BalanceTransaction {
  type: 'initial' | 'trade' | 'achievement' | 'daily-bonus' | 'manual-add';
  amount: number;
  description: string;
  reference?: string;
  balanceAfter: number;
  createdAt: string;
}

interface BalanceHistoryResponse {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  initialBalance: number;
  transactions: BalanceTransaction[];
}

export function ViewBalanceDialog({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: balanceData, isLoading } = useSWR<BalanceHistoryResponse>(
    isOpen ? `/api/users/${userEmail}/balance-history` : null,
    fetcher
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'achievement':
        return <Gift className="h-4 w-4 text-purple-500" />;
      case 'daily-bonus':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'manual-add':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'initial':
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <CreditCard className="mr-2 h-4 w-4" />
          View Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Balance History</DialogTitle>
          <DialogDescription>
            Complete breakdown of your cash balance transactions
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : !balanceData ? (
          <p className="text-center text-muted-foreground">Failed to load balance history</p>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Starting Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(balanceData?.initialBalance || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ${Math.max(0, balanceData?.totalEarned || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    ${(balanceData?.currentBalance || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <div>
              <h3 className="font-semibold mb-4">All Transactions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {balanceData?.transactions && balanceData.transactions.length > 0 ? (
                  balanceData.transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/50">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                            {new Date(tx.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${getTransactionColor(tx.amount)}`}>
                            {tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: ${tx.balanceAfter.toLocaleString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
