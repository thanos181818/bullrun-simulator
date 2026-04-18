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

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();
    const yahooSymbol = YAHOO_SYMBOL_MAP[symbol];

    if (!yahooSymbol) {
      return NextResponse.json({ error: 'Symbol not supported' }, { status: 400 });
    }

    // Dynamic import to avoid issues at build time
    const YahooFinance = await import('yahoo-finance2').then(m => m.default);
    const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });

    const quote = await yf.quote(yahooSymbol);

    if (!quote || quote.regularMarketPrice == null) {
      return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }

    return NextResponse.json({
      symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
