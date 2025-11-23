'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

export default function HistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tradesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'trades'), orderBy('timestamp', 'desc'));
  }, [user, firestore]);

  const { data: trades, isLoading } = useCollection<Trade>(tradesQuery);

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transaction History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Trades</CardTitle>
          <CardDescription>A complete log of all your simulated trades.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeleton()
          ) : !trades || trades.length === 0 ? (
            <p className="text-muted-foreground">You have not made any trades yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {trade.timestamp ? format(trade.timestamp.toDate(), 'PPpp') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{trade.assetSymbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.orderType === 'buy' ? 'default' : 'destructive'}>
                        {trade.orderType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell className="text-right font-mono">${trade.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${trade.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    