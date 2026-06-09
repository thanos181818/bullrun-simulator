import { getCoinGeckoMapping } from './get-coingecko-mapping';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;
const STOCK_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'META', 'NVDA', 'NFLX'];

export async function fetchAllStockPrices(): Promise<Record<string, number>> {
  if (!FINNHUB_KEY) {
    console.error('FINNHUB_API_KEY is missing');
    return {};
  }

  const results = await Promise.allSettled(
    STOCK_SYMBOLS.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`Finnhub fetch failed for ${symbol}`);
      const data = await res.json();
      return { symbol, price: data.c as number };
    })
  );

  const prices: Record<string, number> = {};
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.price > 0) {
      prices[r.value.symbol] = r.value.price;
    }
  }
  return prices;
}

export async function fetchAllCryptoPrices(): Promise<Record<string, number>> {
  try {
    const mapping = await getCoinGeckoMapping();
    const ids = Object.values(mapping).join(',');
    
    if (!ids) return {};

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) throw new Error('CoinGecko fetch failed');
    
    const data = await res.json();
    const prices: Record<string, number> = {};
    
    for (const [symbol, geckoId] of Object.entries(mapping)) {
      if (data[geckoId]?.usd) {
        prices[symbol] = data[geckoId].usd;
      }
    }
    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
}
