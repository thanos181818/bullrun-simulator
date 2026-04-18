import { NextRequest, NextResponse } from 'next/server';

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

// Server-side cache for batch quotes (30 seconds)
let quotesCache: {
  data: Record<string, any>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const now = Date.now();
    
    // Check if we have a valid cache
    if (quotesCache && (now - quotesCache.timestamp < CACHE_TTL)) {
      console.log('  [API] batch-quotes: Serving from server-side cache');
      return NextResponse.json(quotesCache.data);
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const yahooSymbols = symbols.map(s => YAHOO_SYMBOL_MAP[s]).filter(Boolean);

    if (yahooSymbols.length === 0) {
      return NextResponse.json({ error: 'No supported symbols provided' }, { status: 400 });
    }

    // Dynamic import to avoid issues at build time
    const YahooFinance = await import('yahoo-finance2').then(m => m.default);
    const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

    // Yahoo Finance can fetch multiple quotes in one call
    const quotes = await yf.quote(yahooSymbols);
    const results: Record<string, any> = {};
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    quotesArray.forEach((quote: any) => {
      const symbol = Object.keys(YAHOO_SYMBOL_MAP).find(key => YAHOO_SYMBOL_MAP[key] === quote.symbol);
      if (symbol) {
        results[symbol] = {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
        };
      }
    });

    // Update cache
    quotesCache = {
      data: results,
      timestamp: now
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
