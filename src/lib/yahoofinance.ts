/**
 * Yahoo Finance API utilities for fetching historical price data
 * Using yahoo-finance2 library - unlimited free access to full historical data
 * No rate limits, no authentication needed
 */

// Map our symbols to Yahoo Finance symbols
const YAHOO_SYMBOL_MAP: Record<string, string> = {
  // Stocks - use as-is
  AAPL: 'AAPL',
  GOOGL: 'GOOGL',
  MSFT: 'MSFT',
  TSLA: 'TSLA',
  AMZN: 'AMZN',
  NVDA: 'NVDA',
  META: 'META',
  JPM: 'JPM',
  V: 'V',
  JNJ: 'JNJ',
  WMT: 'WMT',
  PG: 'PG',
  UNH: 'UNH',
  HD: 'HD',
  MA: 'MA',
  INTC: 'INTC',
  CRM: 'CRM',
  IBM: 'IBM',
  BA: 'BA',
  GE: 'GE',
  KO: 'KO',
  PEP: 'PEP',
  MCD: 'MCD',
  NFLX: 'NFLX',
  AMD: 'AMD',
  
  // Crypto - add -USD suffix for Yahoo Finance
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  SOL: 'SOL-USD',
  XRP: 'XRP-USD',
  ADA: 'ADA-USD',
  DOGE: 'DOGE-USD',
  MATIC: 'MATIC-USD',
  AVAX: 'AVAX-USD',
  LINK: 'LINK-USD',
  UNI: 'UNI-USD',
};

interface YahooFinanceHistoryPoint {
  timestamp: number;
  price: number;
}

/**
 * Fetch historical price data from Yahoo Finance
 * @param symbol - Asset symbol (e.g., 'BTC', 'ETH', 'AAPL')
 * @param fromDate - Start date (timestamp in ms)
 * @param toDate - End date (timestamp in ms)
 * @returns Array of {timestamp, price} objects
 */
export async function fetchHistoricalData(
  symbol: string,
  fromDate: number,
  toDate: number
): Promise<YahooFinanceHistoryPoint[]> {
  const yahooSymbol = YAHOO_SYMBOL_MAP[symbol];
  
  if (!yahooSymbol) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  try {
    // Dynamic import to avoid issues at build time
    const YahooFinance = await import('yahoo-finance2').then(m => m.default);
    const yf = new YahooFinance();

    console.log(`  Fetching ${symbol} (${yahooSymbol}) from Yahoo Finance...`);

    const quotes = await yf.historical(yahooSymbol, {
      period1: new Date(fromDate),
      period2: new Date(toDate),
      interval: '1d', // Daily data
    });

    if (!quotes || quotes.length === 0) {
      console.warn(`  ⚠️ No price data returned for ${symbol}`);
      return [];
    }

    // Convert Yahoo Finance data to our format
    const history = quotes
      .filter((q: any) => q && q.close && q.date)
      .map((q: any) => ({
        timestamp: new Date(q.date).getTime(),
        price: q.close,
      }));

    console.log(`  ✅ ${symbol}: ${history.length} price points fetched`);

    return history;
  } catch (error) {
    console.error(`  ❌ Error fetching ${symbol}:`, error);
    return [];
  }
}

/**
 * Batch fetch multiple symbols with built-in delays
 * Yahoo Finance has no documented rate limits for historical data
 */
export async function fetchMultipleSymbols(
  symbols: string[],
  fromDate: number,
  toDate: number,
  delayMs: number = 100 // Minimal delay since no rate limits
): Promise<Record<string, YahooFinanceHistoryPoint[]>> {
  const YahooFinance = await import('yahoo-finance2').then(m => m.default);
  const yf = new YahooFinance();
  const results: Record<string, YahooFinanceHistoryPoint[]> = {};

  for (const symbol of symbols) {
    try {
      const history = await fetchHistoricalData(symbol, fromDate, toDate);
      results[symbol] = history;
      
      // Small delay just to be courteous
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      results[symbol] = [];
    }
  }

  return results;
}

/**
 * Test Yahoo Finance connection
 */
export async function testYahooFinanceConnection(): Promise<boolean> {
  try {
    const YahooFinance = await import('yahoo-finance2').then(m => m.default);
    const yf = new YahooFinance();
    
    const quote = await yf.quote('AAPL');
    
    if (quote && quote.regularMarketPrice) {
      console.log(`✅ Yahoo Finance working. AAPL price: $${quote.regularMarketPrice}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Yahoo Finance test failed:', error);
    return false;
  }
}
