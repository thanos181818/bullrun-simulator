'use client';

import type { Trade, Badge, Holding } from './types';
import { useToast } from '@/hooks/use-toast';

// This function is the single entry point to check all badge conditions.
// It will be called after specific user actions (e.g., completing a trade, finishing a module).
// userId can be either email or MongoDB ObjectId
export async function checkAndAwardBadges(
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
): Promise<string[]> {
  if (!userId) return [];

  try {
    console.log('[BADGE CHECK] Starting badge check for user:', userId);
    
    // Fetch user data
    const userResponse = await fetch(`/api/users/${userId}`);
    if (!userResponse.ok) {
      console.error('[BADGE CHECK] Failed to fetch user data');
      return [];
    }
    
    const userData = await userResponse.json();
    const earnedBadges = userData.badgeIds || [];
    console.log('[BADGE CHECK] User currently has badges:', earnedBadges);

    // Fetch all badges
    const badgesResponse = await fetch('/api/badges');
    if (!badgesResponse.ok) {
      console.error('[BADGE CHECK] Failed to fetch badges');
      return [];
    }
    
    const allBadges: Badge[] = await badgesResponse.json();
    
    if (allBadges.length === 0) {
      console.log('[BADGE CHECK] No badges defined in the database.');
      return [];
    }

    const newBadgesAwarded: string[] = [];

    // Helper function to award a badge if not already earned
    const awardBadge = async (badgeId: string, badgeRarity?: string) => {
      if (!earnedBadges.includes(badgeId)) {
        console.log(`[BADGE AWARD] Awarding badge: ${badgeId}`);
        const updatedBadges = [...earnedBadges, badgeId];
        
        // Calculate cash reward based on badge rarity
        let cashReward = 0;
        switch (badgeRarity) {
          case 'legendary':
            cashReward = 5000;
            break;
          case 'epic':
            cashReward = 2500;
            break;
          case 'rare':
            cashReward = 1000;
            break;
          case 'common':
          default:
            cashReward = 500;
            break;
        }

        // Update user badges, cash balance, and total cash earned
        const currentUser = await fetch(`/api/users/${userId}`).then(r => r.json());
        const currentBalance = currentUser.cashBalance || 0;
        const totalCashEarned = (currentUser.cashEarned || 0) + cashReward;
        
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            badgeIds: updatedBadges,
            cashBalance: currentBalance + cashReward,
            cashEarned: totalCashEarned,
          }),
        });
        
        if (!response.ok) {
          console.error(`[BADGE AWARD] Failed to update user with badge ${badgeId}`);
          return 0;
        }
        
        console.log(`[BADGE REWARD] User ${userId} earned badge ${badgeId} and $${cashReward}`);
        
        newBadgesAwarded.push(badgeId);
        earnedBadges.push(badgeId); // Add to local list to prevent re-awarding in same run
        
        return cashReward;
      }
      return 0;
    };

    // --- Start of Badge Logic Checks ---

    // Get user's trades for trade-related badges
    const tradesResponse = await fetch(`/api/users/${userId}/trades`);
    const trades: Trade[] = tradesResponse.ok ? await tradesResponse.json() : [];
    console.log(`[BADGE CHECK] User has ${trades.length} trades`);

    // 1. First Trade Badge
    if (trades.length > 0) {
      const badge = allBadges.find(b => b.id === 'first_trade');
      await awardBadge('first_trade', badge?.rarity);
    }

    // 2. Active Trader Badge (10 trades)
    if (trades.length >= 10) {
      const badge = allBadges.find(b => b.id === 'active_trader');
      await awardBadge('active_trader', badge?.rarity);
    }

    // 3. High Roller Badge (single trade > $10,000)
    if (trades.some((trade) => trade.totalAmount > 10000)) {
      const badge = allBadges.find(b => b.id === 'high_roller');
      await awardBadge('high_roller', badge?.rarity);
    }
      
    // 4. Crypto Pioneer & Stock Specialist
    const hasCryptoTrade = trades.some(trade => trade.assetType === 'crypto');
    const hasStockTrade = trades.some(trade => trade.assetType === 'stock');
    console.log(`[BADGE CHECK] Has crypto trade: ${hasCryptoTrade}, Has stock trade: ${hasStockTrade}`);
    if (hasCryptoTrade) {
      const badge = allBadges.find(b => b.id === 'crypto_pioneer');
      await awardBadge('crypto_pioneer', badge?.rarity);
    }
    if (hasStockTrade) {
      const badge = allBadges.find(b => b.id === 'stock_specialist');
      await awardBadge('stock_specialist', badge?.rarity);
    }

    // Get user's portfolio for portfolio-related badges
    const portfolioResponse = await fetch(`/api/users/${userId}/portfolio`);
    if (portfolioResponse.ok) {
      const portfolio = await portfolioResponse.json();
      const holdings: Holding[] = portfolio.holdings || [];
        
      // 5. Diversifier Badge (hold 5+ assets)
      if (holdings.length >= 5) {
        const badge = allBadges.find(b => b.id === 'diversifier');
        await awardBadge('diversifier', badge?.rarity);
      }
    }

    // === MILESTONE BADGE CHECKS ===
    
    // 11. Dollar Millionaire - Reach $1M portfolio value
    if (userData.portfolioValue >= 1000000) {
      const badge = allBadges.find(b => b.id === 'dollar_millionaire');
      await awardBadge('dollar_millionaire', badge?.rarity);
    }

    // 12. Megawhale - Single trade >= $50,000
    if (trades.some((trade) => trade.totalAmount >= 50000)) {
      const badge = allBadges.find(b => b.id === 'megawhale');
      await awardBadge('megawhale', badge?.rarity);
    }

    // 13. Cash Collector - Earn $100K in cash rewards
    const cashEarned = userData.cashEarned || 0;
    if (cashEarned >= 100000) {
      const badge = allBadges.find(b => b.id === 'cash_collector');
      await awardBadge('cash_collector', badge?.rarity);
    }

    // 14. Profit Master - Make $50K in trading profit
    const totalProfit = userData.totalReturn || 0;
    if (totalProfit >= 50000) {
      const badge = allBadges.find(b => b.id === 'profit_master');
      await awardBadge('profit_master', badge?.rarity);
    }

    // 15. Comeback Kid - Lose 50% then recover to positive
    const maxPortfolioValue = userData.maxPortfolioValue || 0;
    const currentPortfolioValue = userData.portfolioValue || 0;
    const currentTotalReturn = userData.totalReturn || 0;
    
    if (maxPortfolioValue >= 10000 && currentPortfolioValue >= maxPortfolioValue * 0.5 && currentTotalReturn > 0) {
      const badge = allBadges.find(b => b.id === 'comeback_kid');
      await awardBadge('comeback_kid', badge?.rarity);
    }

    // --- End of Badge Logic Checks ---

    // Notify user of new badges
    if (newBadgesAwarded.length > 0) {
      console.log(`[BADGE CHECK] Awarded ${newBadgesAwarded.length} new badges:`, newBadgesAwarded);
      newBadgesAwarded.forEach((badgeId) => {
        const badgeInfo = allBadges.find((b) => b.id === badgeId);
        if (badgeInfo) {
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `You've earned the "${badgeInfo.title}" badge and cash reward!`,
            duration: 5000,
          });
        }
      });
    } else {
      console.log('[BADGE CHECK] No new badges to award');
    }
    
    return newBadgesAwarded;
  } catch (error) {
    console.error('[BADGE CHECK] Error checking badges:', error);
    return [];
  }
}
