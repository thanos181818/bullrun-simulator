'use client';

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
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function RecentTrades() {
  const { data: session } = useSession();

  const { data: trades, isLoading } = useSWR<Trade[]>(
    session?.user?.email ? `/api/users/${session.user.email}/trades` : null,
    fetcher
  );

  const recentTrades = trades?.slice(0, 5) || [];

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
        ) : !recentTrades || recentTrades.length === 0 ? (
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
              {recentTrades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs text-muted-foreground">
                    {trade.timestamp ? format(new Date(trade.timestamp), 'P p') : 'N/A'}
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

    