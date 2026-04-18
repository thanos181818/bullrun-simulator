
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
    
    // FETCH REAL-TIME PRICES: Ensure the AI gets the latest market prices, not stale DB values
    const symbols = assets.map(a => a.symbol);
    
    // We can't call our own API route from a server action easily without full URL,
    // so we call the logic directly or use the same library.
    const YahooFinance = await import('yahoo-finance2').then(m => m.default);
    const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
    
    // Map our symbols to Yahoo symbols (same logic as in our API route)
    const YAHOO_SYMBOL_MAP: Record<string, string> = {
      AAPL: 'AAPL', GOOGL: 'GOOGL', MSFT: 'MSFT', TSLA: 'TSLA', AMZN: 'AMZN',
      NVDA: 'NVDA', META: 'META', JPM: 'JPM', V: 'V', JNJ: 'JNJ',
      WMT: 'WMT', PG: 'PG', UNH: 'UNH', HD: 'HD', MA: 'MA',
      INTC: 'INTC', CRM: 'CRM', IBM: 'IBM', BA: 'BA', GE: 'GE',
      KO: 'KO', PEP: 'PEP', MCD: 'MCD', NFLX: 'NFLX', AMD: 'AMD',
      BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', XRP: 'XRP-USD',
      ADA: 'ADA-USD', DOGE: 'DOGE-USD', MATIC: 'MATIC-USD',
      AVAX: 'AVAX-USD', LINK: 'LINK-USD', UNI: 'UNI-USD'
    };

    const yahooSymbols = symbols.map(s => YAHOO_SYMBOL_MAP[s]).filter(Boolean);
    const quotes = await yf.quote(yahooSymbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    
    const realTimePrices: Record<string, { price: number, change: number, percent: number }> = {};
    quotesArray.forEach((q: any) => {
      const originalSymbol = Object.keys(YAHOO_SYMBOL_MAP).find(key => YAHOO_SYMBOL_MAP[key] === q.symbol);
      if (originalSymbol) {
        realTimePrices[originalSymbol] = {
          price: q.regularMarketPrice,
          change: q.regularMarketChange || 0,
          percent: q.regularMarketChangePercent || 0
        };
      }
    });

    return assets.map(asset => {
      const rt = realTimePrices[asset.symbol];
      const currentPrice = rt ? rt.price : asset.price;
      const change = rt ? rt.change : asset.priceChange24h;
      const changePercent = rt ? rt.percent : (asset.priceChange24h / asset.price) * 100;

      return {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        type: asset.type,
        price: currentPrice,
        priceChange24h: change,
        volume24h: asset.volume24h,
        marketCap: asset.marketCap,
        description: asset.description,
        image: asset.image,
        change: change,
        changePercent: changePercent,
        initialPrice: asset.price,
      };
    }) as Asset[];
  } catch (error) {
    console.error("Error fetching market data for AI:", error);
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
          `${asset.name} (${asset.symbol}): Price $${asset.price.toFixed(2)}, 24h Change: ${asset.changePercent?.toFixed(2)}%, Market Cap: $${(asset.marketCap / 1e9).toFixed(2)}B`
      )
      .join('\n');

    const userPortfolio = await getUserPortfolio(user.email);

    const userPortfolioString = userPortfolio.length > 0 
      ? userPortfolio
          .map(
            (holding: { quantity: number; assetSymbol: string; avgBuyPrice: number; currentPrice?: number; profitLoss?: number; profitLossPercentage?: number }) => {
              const currentPrice = holding.currentPrice || 0;
              const pl = holding.profitLoss || 0;
              const plPercent = holding.profitLossPercentage || 0;
              return `${holding.quantity} of ${holding.assetSymbol} (Avg: $${holding.avgBuyPrice.toFixed(2)}, Current: $${currentPrice.toFixed(2)}, P/L: $${pl.toFixed(2)} / ${plPercent.toFixed(2)}%)`;
            }
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
