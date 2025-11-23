'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

export function useWatchlist() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  const watchlist = useMemo(() => userData?.watchlist || [], [userData]);

  const toggleWatchlist = async (symbol: string) => {
    if (!userDocRef || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to modify the watchlist.',
      });
      return;
    }

    const isWatched = watchlist.includes(symbol);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw 'User document does not exist!';

        if (isWatched) {
          transaction.update(userDocRef, { watchlist: arrayRemove(symbol) });
        } else {
          transaction.update(userDocRef, { watchlist: arrayUnion(symbol) });
        }
      });
      toast({
        title: isWatched ? 'Removed from Watchlist' : 'Added to Watchlist',
        description: `${symbol} has been ${isWatched ? 'removed from' : 'added to'} your watchlist.`,
      });
    } catch (e: any) {
      console.error('Watchlist update failed:', e);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message || 'Could not update watchlist.',
      });
    }
  };
  
  return { watchlist, isLoading, toggleWatchlist };
}
