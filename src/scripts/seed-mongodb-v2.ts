import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectToDatabase from '../lib/mongodb';
import { AssetModel, BadgeModel, PriceHistoryModel } from '../lib/models/schemas';
import { mockAssets, mockBadges } from '../lib/data';
import { fetchHistoricalData, testYahooFinanceConnection } from '../lib/yahoofinance';

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

  // Generate daily data for old history (start to 7 days ago)
  while (currentTime < sevenDaysAgo) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.1;
    const randomWalk = (seededRandom() - 0.5) * 0.08;
    const fluctuation = meanReversionForce + randomWalk;
    
    let newPrice = lastPrice * (1 + fluctuation);
    if (newPrice < basePrice * 0.5) newPrice = basePrice * 0.5;
    if (newPrice > basePrice * 2.0) newPrice = basePrice * 2.0;

    history.push({ symbol, timestamp: currentTime, price: newPrice });
    lastPrice = newPrice;
    currentTime += 24 * 60 * 60 * 1000;
  }
  
  // Generate 15-minute data for 7 days to 1 day ago
  currentTime = sevenDaysAgo;
  while (currentTime < oneDayAgo) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.05;
    const randomWalk = (seededRandom() - 0.5) * 0.02;
    const fluctuation = meanReversionForce + randomWalk;
    
    let newPrice = lastPrice * (1 + fluctuation);
    if (newPrice < basePrice * 0.7) newPrice = basePrice * 0.7;
    if (newPrice > basePrice * 1.5) newPrice = basePrice * 1.5;

    history.push({ symbol, timestamp: currentTime, price: newPrice });
    lastPrice = newPrice;
    currentTime += 15 * 60 * 1000;
  }
  
  // Generate 1-minute data for the last 24 hours
  currentTime = oneDayAgo;
  while (currentTime <= now) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.02;
    const randomWalk = (seededRandom() - 0.5) * 0.005;
    const fluctuation = meanReversionForce + randomWalk;
    
    let newPrice = lastPrice * (1 + fluctuation);
    if (newPrice < basePrice * 0.9) newPrice = basePrice * 0.9;
    if (newPrice > basePrice * 1.1) newPrice = basePrice * 1.1;

    history.push({ symbol, timestamp: currentTime, price: newPrice });
    lastPrice = newPrice;
    currentTime += 60 * 1000;
  }

  return history;
}

function generateSimulatedDataFromDate(
  symbol: string,
  lastRealPrice: number,
  fromDate: number,
  toDate: number
): Array<{ symbol: string; timestamp: number; price: number }> {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = createSeededRandom(seed);
  const history: Array<{ symbol: string; timestamp: number; price: number }> = [];

  let currentTime = fromDate;
  let lastPrice = lastRealPrice;
  const basePrice = lastRealPrice;

  while (currentTime <= toDate) {
    const distanceFromBase = (lastPrice - basePrice) / basePrice;
    const meanReversionForce = -distanceFromBase * 0.1;
    const randomWalk = (seededRandom() - 0.5) * 0.08;
    const fluctuation = meanReversionForce + randomWalk;

    let newPrice = lastPrice * (1 + fluctuation);
    if (newPrice < basePrice * 0.5) newPrice = basePrice * 0.5;
    if (newPrice > basePrice * 2.0) newPrice = basePrice * 2.0;

    history.push({ symbol, timestamp: currentTime, price: newPrice });
    lastPrice = newPrice;
    currentTime += 24 * 60 * 60 * 1000;
  }

  return history;
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding with Yahoo Finance v2.0...\n');
    
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    console.log('\nTesting Yahoo Finance API...');
    const yahooFinanceWorks = await testYahooFinanceConnection();
    
    if (!yahooFinanceWorks) {
      console.warn('⚠️ Yahoo Finance API not working - will use generated data only');
    }

    console.log('\nClearing existing data...');
    await AssetModel.deleteMany({});
    await BadgeModel.deleteMany({});
    await PriceHistoryModel.deleteMany({});

    console.log('\nSeeding assets...');
    const assets = await AssetModel.insertMany(mockAssets);
    console.log(`✅ Seeded ${assets.length} assets (should be 35)`);

    console.log('\nSeeding badges...');
    const badges = await BadgeModel.insertMany(mockBadges);
    console.log(`✅ Seeded ${badges.length} badges`);

    console.log('\nSeeding price history using Yahoo Finance...');
    
    const FEB_1_2026 = new Date('2026-02-01T00:00:00Z').getTime();
    const NOW = Date.now();
    
    const allPriceHistory: Array<{ symbol: string; timestamp: number; price: number }> = [];
    let realDataCount = 0;
    let generatedDataCount = 0;

    for (const asset of mockAssets) {
      console.log(`\n📊 Processing ${asset.symbol} (${asset.type})...`);
      let assetHistory: Array<{ symbol: string; timestamp: number; price: number }> = [];

      if (yahooFinanceWorks) {
        try {
          const ipoDate = (asset as any).ipoDate || 0;
          // Fetch from actual IPO date, not just last 5 years
          const startDate = ipoDate > 0 ? ipoDate : FEB_1_2026 - (5 * 365 * 24 * 60 * 60 * 1000);
          
          console.log(`  Fetching real historical data from ${new Date(startDate).toLocaleDateString()}...`);
          
          const realHistory = await fetchHistoricalData(
            asset.symbol,
            startDate,
            FEB_1_2026
          );

          if (realHistory.length > 0) {
            assetHistory = realHistory.map(h => ({
              symbol: asset.symbol,
              timestamp: h.timestamp,
              price: h.price,
            }));
            realDataCount += assetHistory.length;
            console.log(`  ✅ Got ${assetHistory.length} real data points from Yahoo Finance`);
          } else {
            throw new Error('No data returned');
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch real data, falling back to generated: ${error}`);
          const generated = generatePriceHistory(asset.symbol, asset.initialPrice, (asset as any).ipoDate);
          assetHistory = generated.map(g => ({
            symbol: asset.symbol,
            ...g,
          }));
          generatedDataCount += assetHistory.length;
        }
      } else {
        const generated = generatePriceHistory(asset.symbol, asset.initialPrice, (asset as any).ipoDate);
        assetHistory = generated.map(g => ({
          symbol: asset.symbol,
          ...g,
        }));
        generatedDataCount += assetHistory.length;
        console.log(`  Generated ${assetHistory.length} points (Yahoo Finance unavailable)`);
      }

      const simulatedFromFeb = generateSimulatedDataFromDate(
        asset.symbol,
        asset.initialPrice,
        FEB_1_2026,
        NOW
      );
      assetHistory = [...assetHistory.filter(h => h.timestamp < FEB_1_2026), ...simulatedFromFeb];
      generatedDataCount += simulatedFromFeb.length;

      allPriceHistory.push(...assetHistory);
    }

    console.log('\n💾 Inserting price history into database...');
    const batchSize = 5000;
    for (let i = 0; i < allPriceHistory.length; i += batchSize) {
      const batch = allPriceHistory.slice(i, i + batchSize);
      await PriceHistoryModel.insertMany(batch, { ordered: false });
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allPriceHistory.length / batchSize)} inserted`);
    }

    console.log(`\n✅ Database seeding completed!`);
    console.log(`\n📊 Summary:`);
    console.log(`  Total Assets: ${assets.length}/35`);
    console.log(`  Total Badges: ${badges.length}`);
    console.log(`  Real Data Points: ${realDataCount.toLocaleString()}`);
    console.log(`  Generated Data Points: ${generatedDataCount.toLocaleString()}`);
    console.log(`  Total Price Records: ${allPriceHistory.length.toLocaleString()}`);
    console.log(`\n✨ All ready to go!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
