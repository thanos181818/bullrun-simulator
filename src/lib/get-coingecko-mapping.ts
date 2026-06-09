import connectToDatabase from './mongodb';
import { AssetModel } from './models/schemas';
import { redis, CACHE_KEYS, CACHE_TTL } from './redis';

/**
 * Fetches the mapping of internal symbols to CoinGecko IDs from MongoDB.
 * Caches the result in Redis for 24 hours.
 */
export async function getCoinGeckoMapping(): Promise<Record<string, string>> {
  // Try Redis cache first
  const cached = await redis.get<Record<string, string>>(CACHE_KEYS.coingeckoMapping);
  if (cached) return cached;

  await connectToDatabase();
  
  // Fetch all crypto assets that have a coingeckoId
  const cryptoAssets = await AssetModel.find(
    { type: 'crypto', coingeckoId: { $ne: null } },
    { symbol: 1, coingeckoId: 1 }
  );

  const mapping: Record<string, string> = {};
  cryptoAssets.forEach(asset => {
    mapping[asset.symbol] = asset.coingeckoId!;
  });

  // Fallback if DB is empty but we have hardcoded ones for initial setup
  if (Object.keys(mapping).length === 0) {
    const fallback = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
    };
    // Don't cache the fallback for 24h, just use it
    return fallback;
  }

  // Cache in Redis for 24 hours
  await redis.set(CACHE_KEYS.coingeckoMapping, mapping, { ex: CACHE_TTL.coingeckoMapping });

  return mapping;
}
