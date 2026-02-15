
'use server';
import {
  getTradingInsights,
  type TradingInsightsInput,
} from '@/ai/flows/ai-trading-insights';
import { getServerSession } from 'next-auth';
import connectToDatabase from './mongodb';
import { AssetModel, UserModel } from './models/schemas';
import type { Asset } from './types';

async function getAuthenticatedUser() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return null;
    return session.user;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

async function getUserPortfolio(userEmail: string) {
  try {
    await connectToDatabase();
    const user = await UserModel.findOne({ email: userEmail }).lean();
    if (!user) return [];
    
    // Fetch the user's portfolio
    const portfolioResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${userEmail}/portfolio`);
    if (!portfolioResponse.ok) return [];
    
    const portfolio = await portfolioResponse.json();
    return portfolio.holdings || [];
  } catch(error) {
    console.error("Error fetching user portfolio:", error);
    return [];
  }
}

async function getMarketData(): Promise<Asset[]> {
  try {
    await connectToDatabase();
    const assets = await AssetModel.find({}).lean();
    if (!assets || assets.length === 0) return [];
    
    return assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      price: asset.price,
      priceChange24h: asset.priceChange24h,
      volume24h: asset.volume24h,
      marketCap: asset.marketCap,
      description: asset.description,
      image: asset.image,
      change: asset.priceChange24h,
      changePercent: (asset.priceChange24h / asset.price) * 100,
      initialPrice: asset.price,
    })) as Asset[];
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

// This is a server-action that can be called from client components.
export async function getAIInsightsAction(): Promise<{ insights: string } | { error: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.email) {
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

    const userPortfolio = await getUserPortfolio(user.email);

    const userPortfolioString = userPortfolio.length > 0 
      ? userPortfolio
          .map(
            (holding: { quantity: number; assetSymbol: string; avgBuyPrice: number }) =>
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
  } catch (error) {
    console.error('Error getting AI trading insights:', error);
    // Avoid leaking internal error details to the client
    if (error instanceof Error && (error.message.includes('permission-denied') || error.message.includes('unauthenticated'))) {
      return { error: 'Authentication failed. Please log in again.' };
    }
    return { error: 'Failed to generate AI insights. Please try again later.' };
  }
}
