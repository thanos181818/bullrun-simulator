
import type {
  Asset,
  Badge,
} from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const mockBadges: Badge[] = [
  {
    id: 'first_trade',
    title: 'First Trade',
    description: 'Awarded for making your first trade.',
    icon: 'PocketKnife',
    unlockedIcon: 'PocketKnife',
    rarity: 'common',
  },
  {
    id: 'profit_target',
    title: 'Profit Achiever',
    description: 'Awarded for reaching a profit of over $20,000.',
    icon: 'Award',
    unlockedIcon: 'Award',
    rarity: 'rare',
  },
  {
    id: 'streak_badge',
    title: 'Streak',
    description: 'Awarded for logging in 5 days in a row.',
    icon: 'Repeat',
    unlockedIcon: 'Repeat',
    rarity: 'rare',
  },
  {
    id: 'diversifier',
    title: 'Diversifier',
    description: 'Hold at least 5 different assets in your portfolio.',
    icon: 'Sparkles',
    unlockedIcon: 'Sparkles',
    rarity: 'rare',
  },
  {
    id: 'active_trader',
    title: 'Active Trader',
    description: 'Execute 10 trades.',
    icon: 'Zap',
    unlockedIcon: 'Zap',
    rarity: 'common',
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Execute a single trade with a value over $10,000.',
    icon: 'Crown',
    unlockedIcon: 'Crown',
    rarity: 'epic',
  },
  {
    id: 'crypto_pioneer',
    title: 'Crypto Pioneer',
    description: 'Make your first cryptocurrency trade.',
    icon: 'Bitcoin',
    unlockedIcon: 'Bitcoin',
    rarity: 'common',
  },
  {
    id: 'stock_specialist',
    title: 'Stock Specialist',
    description: 'Make your first stock trade.',
    icon: 'Landmark',
    unlockedIcon: 'Landmark',
    rarity: 'common',
  },
  {
    id: 'dollar_millionaire',
    title: 'Dollar Millionaire',
    description: 'Reach a portfolio value of $1,000,000.',
    icon: 'DollarSign',
    unlockedIcon: 'DollarSign',
    rarity: 'legendary',
  },
  {
    id: 'megawhale',
    title: 'Megawhale',
    description: 'Execute a single trade worth $50,000 or more.',
    icon: 'Whale',
    unlockedIcon: 'Whale',
    rarity: 'legendary',
  },
  {
    id: 'cash_collector',
    title: 'Cash Collector',
    description: 'Earn $100,000 in total cash rewards.',
    icon: 'Wallet',
    unlockedIcon: 'Wallet',
    rarity: 'epic',
  },
  {
    id: 'profit_master',
    title: 'Profit Master',
    description: 'Make $50,000 in trading profit.',
    icon: 'LineChart',
    unlockedIcon: 'LineChart',
    rarity: 'epic',
  },
  {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Recover from a 50% portfolio loss back to positive gains.',
    icon: 'RefreshCw',
    unlockedIcon: 'RefreshCw',
    rarity: 'epic',
  },
];

export const baseAssets: (Omit<Asset, 'price' | 'change' | 'changePercent'> & { ipoDate: number })[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', marketCap: 2800000000000, type: 'stock', initialPrice: 172.25, ipoDate: new Date('1980-12-12').getTime() },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', marketCap: 1750000000000, type: 'stock', initialPrice: 139.50, ipoDate: new Date('2004-08-19').getTime() },
  { symbol: 'MSFT', name: 'Microsoft Corp.', marketCap: 2450000000000, type: 'stock', initialPrice: 330.10, ipoDate: new Date('1986-03-13').getTime() },
  { symbol: 'TSLA', name: 'Tesla, Inc.', marketCap: 800000000000, type: 'stock', initialPrice: 250.70, ipoDate: new Date('2010-06-29').getTime() },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', marketCap: 1340000000000, type: 'stock', initialPrice: 130.45, ipoDate: new Date('1997-05-15').getTime() },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', marketCap: 1120000000000, type: 'stock', initialPrice: 450.25, ipoDate: new Date('1999-01-22').getTime() },
  { symbol: 'META', name: 'Meta Platforms, Inc.', marketCap: 805000000000, type: 'stock', initialPrice: 315.60, ipoDate: new Date('2012-05-18').getTime() },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', marketCap: 430000000000, type: 'stock', initialPrice: 145.80, ipoDate: new Date('1980-01-01').getTime() },
  { symbol: 'V', name: 'Visa Inc.', marketCap: 480000000000, type: 'stock', initialPrice: 240.15, ipoDate: new Date('2008-03-19').getTime() },
  { symbol: 'JNJ', name: 'Johnson & Johnson', marketCap: 430000000000, type: 'stock', initialPrice: 165.40, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'WMT', name: 'Walmart Inc.', marketCap: 420000000000, type: 'stock', initialPrice: 155.90, ipoDate: new Date('1972-08-25').getTime() },
  { symbol: 'PG', name: 'Procter & Gamble Co.', marketCap: 360000000000, type: 'stock', initialPrice: 150.20, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', marketCap: 485000000000, type: 'stock', initialPrice: 520.50, ipoDate: new Date('1984-10-17').getTime() },
  { symbol: 'HD', name: 'The Home Depot, Inc.', marketCap: 335000000000, type: 'stock', initialPrice: 330.70, ipoDate: new Date('1981-09-22').getTime() },
  { symbol: 'MA', name: 'Mastercard Inc.', marketCap: 370000000000, type: 'stock', initialPrice: 390.80, ipoDate: new Date('2006-05-25').getTime() },
  { symbol: 'INTC', name: 'Intel Corporation', marketCap: 240000000000, type: 'stock', initialPrice: 32.50, ipoDate: new Date('1972-02-14').getTime() },
  { symbol: 'CRM', name: 'Salesforce, Inc.', marketCap: 280000000000, type: 'stock', initialPrice: 215.75, ipoDate: new Date('2004-06-23').getTime() },
  { symbol: 'IBM', name: 'International Business Machines', marketCap: 220000000000, type: 'stock', initialPrice: 185.20, ipoDate: new Date('1981-01-01').getTime() },
  { symbol: 'BA', name: 'The Boeing Company', marketCap: 190000000000, type: 'stock', initialPrice: 198.60, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'GE', name: 'General Electric Company', marketCap: 215000000000, type: 'stock', initialPrice: 95.45, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'KO', name: 'The Coca-Cola Company', marketCap: 275000000000, type: 'stock', initialPrice: 58.90, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', marketCap: 245000000000, type: 'stock', initialPrice: 175.25, ipoDate: new Date('1972-01-01').getTime() },
  { symbol: 'MCD', name: "McDonald's Corporation", marketCap: 190000000000, type: 'stock', initialPrice: 285.15, ipoDate: new Date('1970-01-01').getTime() },
  { symbol: 'NFLX', name: 'Netflix, Inc.', marketCap: 280000000000, type: 'stock', initialPrice: 425.50, ipoDate: new Date('2002-05-23').getTime() },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', marketCap: 215000000000, type: 'stock', initialPrice: 140.90, ipoDate: new Date('1992-09-12').getTime() },
  { symbol: 'BTC', name: 'Bitcoin', marketCap: 830000000000, type: 'crypto', initialPrice: 42500.00, ipoDate: new Date('2013-01-01').getTime() },
  { symbol: 'ETH', name: 'Ethereum', marketCap: 276000000000, type: 'crypto', initialPrice: 2300.00, ipoDate: new Date('2015-07-30').getTime() },
  { symbol: 'SOL', name: 'Solana', marketCap: 30000000000, type: 'crypto', initialPrice: 75.50, ipoDate: new Date('2020-04-10').getTime() },
  { symbol: 'XRP', name: 'XRP', marketCap: 32000000000, type: 'crypto', initialPrice: 0.62, ipoDate: new Date('2013-08-04').getTime() },
  { symbol: 'ADA', name: 'Cardano', marketCap: 14000000000, type: 'crypto', initialPrice: 0.40, ipoDate: new Date('2017-10-01').getTime() },
  { symbol: 'DOGE', name: 'Dogecoin', marketCap: 22000000000, type: 'crypto', initialPrice: 0.08, ipoDate: new Date('2013-12-06').getTime() },
  { symbol: 'MATIC', name: 'Polygon', marketCap: 8500000000, type: 'crypto', initialPrice: 0.85, ipoDate: new Date('2019-04-28').getTime() },
  { symbol: 'AVAX', name: 'Avalanche', marketCap: 12000000000, type: 'crypto', initialPrice: 65.75, ipoDate: new Date('2020-09-21').getTime() },
  { symbol: 'LINK', name: 'Chainlink', marketCap: 16000000000, type: 'crypto', initialPrice: 15.25, ipoDate: new Date('2017-09-19').getTime() },
  { symbol: 'UNI', name: 'Uniswap', marketCap: 9500000000, type: 'crypto', initialPrice: 6.30, ipoDate: new Date('2020-09-17').getTime() },
];

function createSeededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function generatePriceHistory(symbol: string, initialPrice: number, ipoDate?: number) {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = createSeededRandom(seed);
  const now = Date.now();
  
  const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60 * 1000);
  const startDate = ipoDate && ipoDate > fiveYearsAgo ? ipoDate : fiveYearsAgo;
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  if (ipoDate && ipoDate > fiveYearsAgo) {
    const ageInYears = (now - ipoDate) / (365 * 24 * 60 * 60 * 1000);
    console.log(`  ${symbol}: IPO ${ageInYears.toFixed(1)} years ago, starting from IPO date`);
  }
  
  const history: Array<{ symbol: string; timestamp: number; price: number }> = [];
  
  let currentTime = startDate;
  let lastPrice = initialPrice > 0 ? initialPrice : 1;
  const basePrice = lastPrice;

  while (currentTime < sevenDaysAgo) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.1;
    const randomWalk = (seededRandom() - 0.5) * 0.08;
    const fluctuation = meanReversionForce + randomWalk;
    
    let newPrice = lastPrice * (1 + fluctuation);
    newPrice = Math.max(0.01, newPrice);
    
    history.push({
      symbol,
      timestamp: currentTime,
      price: parseFloat(newPrice.toFixed(2))
    });
    
    lastPrice = newPrice;
    currentTime += 24 * 60 * 60 * 1000;
  }

  while (currentTime < oneDayAgo) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.08;
    const randomWalk = (seededRandom() - 0.5) * 0.12;
    const fluctuation = meanReversionForce + randomWalk;
    
    let newPrice = lastPrice * (1 + fluctuation);
    newPrice = Math.max(0.01, newPrice);
    
    const timestampMs = Math.floor(currentTime / (60 * 60 * 1000)) * (60 * 60 * 1000);
    history.push({
      symbol,
      timestamp: timestampMs,
      price: parseFloat(newPrice.toFixed(2))
    });
    
    lastPrice = newPrice;
    currentTime += 60 * 60 * 1000;
  }

  for (let i = 0; i < 7; i++) {
    for (let h = 0; h < 24; h++) {
      const distanceFromBase = (lastPrice - basePrice) / basePrice;
      const meanReversionForce = -distanceFromBase * 0.05;
      const randomWalk = (seededRandom() - 0.5) * 0.15;
      const fluctuation = meanReversionForce + randomWalk;
      
      let newPrice = lastPrice * (1 + fluctuation);
      newPrice = Math.max(0.01, newPrice);
      
      history.push({
        symbol,
        timestamp: currentTime,
        price: parseFloat(newPrice.toFixed(2))
      });
      
      lastPrice = newPrice;
      currentTime += 60 * 60 * 1000;
    }
  }

  return history;
}

// Create mockAssets with price fields for seeding
export const mockAssets: Asset[] = baseAssets.map(asset => ({
  ...asset,
  price: asset.initialPrice,
  change: 0,
  changePercent: 0,
}));

export { generatePriceHistory };
