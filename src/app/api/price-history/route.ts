import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PriceHistoryModel } from '@/lib/models/schemas';

// GET /api/price-history?symbol=AAPL&from=timestamp&to=timestamp&range=1D
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const range = searchParams.get('range'); // 6H, 1D, 1W, 1M, 1Y, 5Y, ALL
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const now = Date.now();
    let startTime: number;
    let endTime: number = to ? parseInt(to) : now;
    let maxDataPoints: number;

    // Calculate time range and max data points based on range parameter
    if (range) {
      switch (range) {
        case '6H':
          startTime = now - (6 * 60 * 60 * 1000);
          maxDataPoints = 360; // Show all minute-level data
          break;
        case '1D':
          startTime = now - (24 * 60 * 60 * 1000);
          maxDataPoints = 480; // Show all minute-level data
          break;
        case '1W':
          startTime = now - (7 * 24 * 60 * 60 * 1000);
          maxDataPoints = 336; // ~Every 30 minutes
          break;
        case '1M':
          startTime = now - (30 * 24 * 60 * 60 * 1000);
          maxDataPoints = 360; // ~Every 2 hours
          break;
        case '1Y':
          startTime = now - (365 * 24 * 60 * 60 * 1000);
          maxDataPoints = 365; // Daily
          break;
        case '5Y':
          startTime = now - (5 * 365 * 24 * 60 * 60 * 1000);
          maxDataPoints = 260; // Weekly
          break;
        case 'ALL':
          startTime = now - (5 * 365 * 24 * 60 * 60 * 1000);
          maxDataPoints = 260; // Weekly
          break;
        default:
          startTime = now - (24 * 60 * 60 * 1000);
          maxDataPoints = 480;
      }
    } else if (from) {
      startTime = parseInt(from);
      maxDataPoints = 500;
    } else {
      // Default to last 24 hours
      startTime = now - (24 * 60 * 60 * 1000);
      maxDataPoints = 480;
    }

    // Fetch price history from MongoDB
    const priceHistory = await PriceHistoryModel
      .find({
        symbol: symbol.toUpperCase(),
        timestamp: { $gte: startTime, $lte: endTime }
      })
      .sort({ timestamp: 1 })
      .select('timestamp price -_id')
      .lean();

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
