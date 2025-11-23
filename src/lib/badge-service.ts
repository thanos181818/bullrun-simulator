'use client';

import {
  Firestore,
  doc,
  getDocs,
  collection,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import type { Trade, Badge, Holding } from './types';
import { useToast } from '@/hooks/use-toast';

// This function is the single entry point to check all badge conditions.
// It will be called after specific user actions (e.g., completing a trade, finishing a module).
export async function checkAndAwardBadges(
  firestore: Firestore,
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) {
  if (!firestore || !userId) return;

  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) return;

  const userData = userDoc.data();
  const earnedBadges = userData.badgeIds || [];

  const allBadgesSnapshot = await getDocs(collection(firestore, 'badges'));
  // Handle case where badges collection might be empty or inaccessible
  if (allBadgesSnapshot.empty) {
    console.log("No badges defined in the database.");
    return;
  }
  const allBadges = allBadgesSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Badge)
  );

  const newBadgesAwarded: string[] = [];

  // Helper function to award a badge if not already earned
  const awardBadge = async (badgeId: string) => {
    if (!earnedBadges.includes(badgeId)) {
      await updateDoc(userDocRef, {
        badgeIds: arrayUnion(badgeId),
      });
      newBadgesAwarded.push(badgeId);
      earnedBadges.push(badgeId); // Add to local list to prevent re-awarding in same run
    }
  };

  // --- Start of Badge Logic Checks ---

  // Get user's trades for trade-related badges
  const tradesSnapshot = await getDocs(
    collection(firestore, 'users', userId, 'trades')
  );
  // Safely access docs property
  const trades = tradesSnapshot ? tradesSnapshot.docs.map((doc) => doc.data() as Trade) : [];


  // 1. First Trade Badge
  if (trades.length > 0) {
    await awardBadge('first_trade');
  }

  // 2. Active Trader Badge (10 trades)
  if (trades.length >= 10) {
    await awardBadge('active_trader');
  }

  // 3. High Roller Badge (single trade > $10,000)
  if (trades.some((trade) => trade.totalAmount > 10000)) {
    await awardBadge('high_roller');
  }
    
  // 4. Crypto Pioneer & Stock Specialist
  const hasCryptoTrade = trades.some(trade => trade.assetType === 'crypto');
  const hasStockTrade = trades.some(trade => trade.assetType === 'stock');
  if (hasCryptoTrade) {
    await awardBadge('crypto_pioneer');
  }
  if (hasStockTrade) {
    await awardBadge('stock_specialist');
  }

  // Get user's portfolio for portfolio-related badges
  const portfolioDoc = await getDoc(doc(firestore, 'users', userId, 'portfolios', 'simulated'));
  if (portfolioDoc.exists()) {
      const holdings = portfolioDoc.data().holdings as Holding[] || [];
      
      // 5. Diversifier Badge (hold 5+ assets)
      if (holdings.length >= 5) {
          await awardBadge('diversifier');
      }
  }


  // --- End of Badge Logic Checks ---

  // Notify user of new badges
  if (newBadgesAwarded.length > 0) {
    newBadgesAwarded.forEach((badgeId) => {
      const badgeInfo = allBadges.find((b) => b.id === badgeId);
      if (badgeInfo) {
        toast({
          title: '🏆 Achievement Unlocked!',
          description: `You've earned the "${badgeInfo.title}" badge.`,
        });
      }
    });
  }
}
