import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { AssetModel } from '@/lib/models/schemas';
import connectToDatabase from '@/lib/mongodb';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  const cacheKey = CACHE_KEYS.quotePrefix(symbol);

  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  await connectToDatabase();

  // Determine if this is a crypto asset by checking the DB
  const asset = await AssetModel.findOne({ symbol }, { type: 1, coingeckoId: 1 });
  const isCrypto = asset?.type === 'crypto';

  let quoteData: Record<string, any>;

  if (isCrypto && asset?.coingeckoId) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${asset.coingeckoId}?localization=false&tickers=false&community_data=false`
    );
    if (!res.ok) return NextResponse.json({ error: 'CoinGecko fetch failed' }, { status: 500 });
    
    const data = await res.json();
    quoteData = {
      symbol,
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h,
      change24hAbs: data.market_data.price_change_24h,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      marketCap: data.market_data.market_cap.usd,
      volume: data.market_data.total_volume.usd,
      type: 'crypto',
    };
  } else {
    // Stock — fetch quote and company profile in parallel
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
    ]);
    
    if (!quoteRes.ok || !profileRes.ok) {
      return NextResponse.json({ error: 'Finnhub fetch failed' }, { status: 500 });
    }

    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);
    quoteData = {
      symbol,
      price: quote.c,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      prevClose: quote.pc,
      change: quote.d,
      changePercent: quote.dp,
      companyName: profile.name,
      sector: profile.finnhubIndustry,
      marketCap: (profile.marketCapitalization ?? 0) * 1_000_000,
      logo: profile.logo,
      exchange: profile.exchange,
      type: 'stock',
    };
  }

  await redis.set(cacheKey, quoteData, { ex: CACHE_TTL.singleQuote });
  return NextResponse.json(quoteData);
}
