import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PriceHistoryModel } from '@/lib/models/schemas';
import { fetchHistoricalData } from '@/lib/yahoofinance';
import { fetchCryptoHistory } from '@/lib/coingecko';

// GET /api/price-history?symbol=AAPL&from=timestamp&to=timestamp&range=1D
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const range = searchParams.get('range') || '1D'; // 6H, 1D, 1W, 1M, 1Y, 5Y, ALL
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const now = Date.now();
    let startTime: number;
    let endTime: number = now;
    let maxDataPoints: number;
    let yahooInterval: '1m' | '5m' | '30m' | '1h' | '1d' | '1wk' = '1d';

    // Calculate time range and max data points based on range parameter
    switch (range) {
      case '6H':
        startTime = now - (6 * 60 * 60 * 1000);
        maxDataPoints = 360; 
        yahooInterval = '1m';
        break;
      case '1D':
        startTime = now - (24 * 60 * 60 * 1000);
        maxDataPoints = 288; // every 5 mins
        yahooInterval = '2m'; // Increased resolution for 1D
        break;
      case '1W':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        maxDataPoints = 336; // every 30 mins
        yahooInterval = '15m'; // Increased resolution for 1W
        break;
      case '1M':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        maxDataPoints = 360; // every 2 hours
        yahooInterval = '1h';
        break;
      case '1Y':
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        maxDataPoints = 365; // daily
        yahooInterval = '1d';
        break;
      case '5Y':
        startTime = now - (5 * 365 * 24 * 60 * 60 * 1000);
        maxDataPoints = 260; // weekly
        yahooInterval = '1wk';
        break;
      case 'ALL':
        startTime = now - (10 * 365 * 24 * 60 * 60 * 1000); // 10 years
        maxDataPoints = 500;
        yahooInterval = '1wk';
        break;
      default:
        startTime = now - (24 * 60 * 60 * 1000);
        maxDataPoints = 288;
        yahooInterval = '5m';
    }

    // First, try to fetch from MongoDB
    let priceHistory = await PriceHistoryModel
      .find({
        symbol,
        timestamp: { $gte: startTime, $lte: endTime }
      })
      .sort({ timestamp: 1 })
      .select('timestamp price -_id')
      .lean();

    // FILTER OUT FUTURE DATA: Ensure we don't return data points from the future (simulation residue)
    priceHistory = priceHistory.filter(p => p.timestamp <= now);

    // FORCE REAL DATA: If we have ANY data that looks like mock data (jittery) 
    // or if we're missing more than 20% of the expected points, fetch from real API.
    const expectedPoints = maxDataPoints * 0.8;
    
    // Check for cached data in MongoDB first (data updated in the last 15 minutes is considered fresh for long ranges)
    const CACHE_FRESHNESS = range === '1D' || range === '6H' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const latestPoint = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].timestamp : 0;
    const isDataFresh = (now - latestPoint) < CACHE_FRESHNESS;

    // Detect if data is out of bounds or jittery (e.g. AAPL > 250)
    // Also detect the old $161 fallback prices that don't belong in recent history
    const isMockData = priceHistory.some(p => (p.price > 250 || p.price < 170) && symbol === 'AAPL' && p.timestamp > (now - 30 * 24 * 60 * 60 * 1000));

    if (!isDataFresh || priceHistory.length < expectedPoints || isMockData || range === '6H') {
      console.log(`  [API] Refreshing ${symbol} (${range}) with 100% real data...`);
      
      let externalData: { timestamp: number, price: number }[] = [];
      
      try {
        // Determine if it's a crypto or stock
        const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI'].includes(symbol);
        
        // Parallel fetch and setup
        const YahooFinance = await import('yahoo-finance2').then(m => m.default);
        const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

        if (isCrypto) {
          externalData = await fetchCryptoHistory(symbol, startTime, endTime);
        } else {
          // Internal call to fetchHistoricalData uses its own yf instance, 
          // but we'll use our instance for consistency if we were calling directly.
          // For now, we just pass the interval.
          externalData = await fetchHistoricalData(symbol, startTime, endTime, yahooInterval);
        }

        if (externalData.length > 0) {
          // Format for MongoDB
          const mongoEntries = externalData.map(item => ({
            symbol,
            timestamp: item.timestamp,
            price: item.price
          }));

          // Backfill MongoDB asynchronously (don't wait for it to return response)
          // We use upsert to avoid duplicates
          const bulkOps = mongoEntries.map(entry => ({
            updateOne: {
              filter: { symbol, timestamp: entry.timestamp },
              update: { $set: entry },
              upsert: true
            }
          }));
          
          PriceHistoryModel.bulkWrite(bulkOps).catch(e => console.error('Bulk write error:', e));
          
          priceHistory = externalData;
        }
      } catch (apiError) {
        console.error('External API fetch failed:', apiError);
      }
    }

    // Downsample if needed for performance
    let result = priceHistory;
    if (priceHistory.length > maxDataPoints) {
      const step = Math.ceil(priceHistory.length / maxDataPoints);
      result = priceHistory.filter((_, index) => 
        index % step === 0 || index === priceHistory.length - 1
      );
    }

    // Convert to expected format
    const formattedResult = result.map(item => ({
      time: item.timestamp,
      price: item.price
    }));

    return NextResponse.json(formattedResult);

  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
