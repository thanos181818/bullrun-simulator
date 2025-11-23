
'use server';
import {
  getTradingInsights,
  type TradingInsightsInput,
} from '@/ai/flows/ai-trading-insights';
import { auth } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { initializeFirebaseAdmin } from './firebase-admin';
import type { Asset } from './types';

async function getAuthenticatedUser() {
  try {
    const idToken = headers().get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return null;
    initializeFirebaseAdmin();
    const decodedToken = await auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

async function getUserPortfolio(userId: string) {
    try {
        initializeFirebaseAdmin();
        const firestore = getFirestore();
        const portfolioDoc = await firestore.collection('users').doc(userId).collection('portfolios').doc('simulated').get();
        if (!portfolioDoc.exists) return [];
        return portfolioDoc.data()?.holdings || [];
    } catch(error) {
        console.error("Error fetching user portfolio:", error);
        return [];
    }
}

async function getMarketData(): Promise<Asset[]> {
    try {
        initializeFirebaseAdmin();
        const firestore = getFirestore();
        const assetsSnapshot = await firestore.collection('assets').get();
        if (assetsSnapshot.empty) return [];
        return assetsSnapshot.docs.map(doc => doc.data() as Asset);
    } catch (error) {
        console.error("Error fetching market data:", error);
        return [];
    }
}

// This is a server-action that can be called from client components.
export async function getAIInsightsAction(): Promise<{ insights: string } | { error: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
        return { error: 'Authentication required to get personalized insights.' };
    }

    const marketData = await getMarketData();
    if (marketData.length === 0) {
        return { error: 'Could not retrieve market data.' };
    }

    const marketDataString = marketData
      .map(
        (asset) =>
          `${asset.name} (${asset.symbol}): Price $${asset.price.toFixed(
            2
          )}`
      )
      .join('\n');

    const userPortfolio = await getUserPortfolio(user.uid);

    const userPortfolioString = userPortfolio.length > 0 
      ? userPortfolio
          .map(
            (holding: any) =>
              `${holding.quantity} of ${
                holding.assetSymbol
              } at avg. price $${holding.avgBuyPrice.toFixed(2)}`
          )
          .join('\n')
      : "User has no holdings in their simulated portfolio.";

    const input: TradingInsightsInput = {
      marketData: marketDataString,
      userPortfolio: userPortfolioString,
    };
    
    // Calling the Genkit flow
    const result = await getTradingInsights(input);
    return result;
  } catch (error: any) {
    console.error('Error getting AI trading insights:', error);
    // Avoid leaking internal error details to the client
    if (error.message.includes('permission-denied') || error.message.includes('unauthenticated')) {
        return { error: 'Authentication failed. Please log in again.' };
    }
    return { error: 'Failed to generate AI insights. Please try again later.' };
  }
}
