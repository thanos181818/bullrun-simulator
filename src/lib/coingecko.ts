/**
 * CoinGecko API utilities for fetching historical crypto price data
 * Free API - 10-50 calls/minute (no authentication needed)
 * The demo key provided doesn't work on any endpoint, so we use free tier without auth
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
// Demo key doesn't work, so we skip it and rely on free tier limits
// Free tier: 10-50 calls/minute depending on time of day

// Map our symbols to CoinGecko IDs
const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  UNI: 'uniswap',
};

interface CoinGeckoHistoryPoint {
  timestamp: number;
  price: number;
}

/**
 * Fetch historical price data from CoinGecko
 * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH')
 * @param fromDate - Start date (timestamp in ms)
 * @param toDate - End date (timestamp in ms)
 * @returns Array of {timestamp, price} objects
 */
export async function fetchCryptoHistory(
  symbol: string,
  fromDate: number,
  toDate: number
): Promise<CoinGeckoHistoryPoint[]> {
  const coinId = CRYPTO_ID_MAP[symbol];
  
  if (!coinId) {
    throw new Error(`Unknown crypto symbol: ${symbol}`);
  }

  try {
    // Calculate days between fromDate and toDate
    const daysCount = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    
    // Use market_chart endpoint - free tier supports this without auth
    // This gives us historical data for the past N days
    const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?` +
      `vs_currency=usd&days=${daysCount}`;

    console.log(`  Fetching ${symbol} (${coinId}) from CoinGecko (${daysCount} days)...`);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // CoinGecko returns prices as [timestamp_ms, price]
    const prices = data.prices || [];

    if (prices.length === 0) {
      console.warn(`  ⚠️ No price data returned for ${symbol}`);
      return [];
    }

    // Convert to our format and filter out nulls
    const history = prices
      .filter((p: [number, number]) => p && p[0] && p[1])
      .map((p: [number, number]) => ({
        timestamp: p[0],
        price: p[1],
      }));

    console.log(`  ✅ ${symbol}: ${history.length} price points fetched`);

    return history;
  } catch (error) {
    console.error(`  ❌ Error fetching ${symbol}:`, error);
    return [];
  }
}

/**
 * Batch fetch multiple cryptos with rate limiting
 * CoinGecko free tier: 10-50 calls/minute (depends on time of day)
 * Using 2000ms (2 second) delay = ~30 calls/minute = safe margin
 */
export async function fetchMultipleCryptos(
  symbols: string[],
  fromDate: number,
  toDate: number,
  delayMs: number = 2000 // 2 seconds = ~30 calls/min = safe for free tier
): Promise<Record<string, CoinGeckoHistoryPoint[]>> {
  const results: Record<string, CoinGeckoHistoryPoint[]> = {};

  for (const symbol of symbols) {
    try {
      const history = await fetchCryptoHistory(symbol, fromDate, toDate);
      results[symbol] = history;
      
      // Rate limiting: wait before next request
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      results[symbol] = [];
    }
  }

  return results;
}

/**
 * Get current crypto price (for testing connection)
 * Uses free tier without authentication
 */
export async function testCoinGeckoConnection(): Promise<boolean> {
  try {
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`API test failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    const price = data.bitcoin?.usd;
    
    if (price) {
      console.log(`✅ CoinGecko API working. Bitcoin price: $${price}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ CoinGecko API test failed:', error);
    return false;
  }
}
