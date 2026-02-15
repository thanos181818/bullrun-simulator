'use client';

import { useUser } from '@/database/provider';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWatchlist() {
  const { user } = useUser();
  const { toast } = useToast();

  const watchlist = useMemo(() => user?.watchlist || [], [user]);

  const toggleWatchlist = async (symbol: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to modify the watchlist.',
      });
      return;
    }

    const isWatched = watchlist.includes(symbol);
    const newWatchlist = isWatched
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];

    try {
      const response = await fetch(`/api/users/${user.email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: newWatchlist }),
      });

      if (!response.ok) {
        throw new Error('Failed to update watchlist');
      }

      // Revalidate user data to update UI immediately
      mutate(`/api/users/${user.email}`);

      toast({
        title: isWatched ? 'Removed from Watchlist' : 'Added to Watchlist',
        description: `${symbol} has been ${isWatched ? 'removed from' : 'added to'} your watchlist.`,
      });
    } catch (e) {
      console.error('Watchlist update failed:', e);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message || 'Could not update watchlist.',
      });
    }
  };
  
  return { watchlist, isLoading: false, toggleWatchlist };
}
