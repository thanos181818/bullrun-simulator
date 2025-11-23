'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trade } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import Link from 'next/link';

export function RecentTrades() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tradesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'trades'), orderBy('timestamp', 'desc'), limit(5));
  }, [user, firestore]);

  const { data: trades, isLoading } = useCollection<Trade>(tradesQuery);

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between'>
        <div>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your last 5 trades.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
            <Link href="/history">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderSkeleton()
        ) : !trades || trades.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">You have no recent trades.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs text-muted-foreground">
                    {trade.timestamp ? format(trade.timestamp.toDate(), 'P p') : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">{trade.assetSymbol}</TableCell>
                  <TableCell>
                    <Badge variant={trade.orderType === 'buy' ? 'default' : 'destructive'}>
                      {trade.orderType.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${trade.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

    