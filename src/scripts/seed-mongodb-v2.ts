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
  let lastPrice = lastRealPrice; // Start from actual last real price
  const maxPrice = lastRealPrice * 1.15;  // Allow +15% max
  const minPrice = lastRealPrice * 0.85;  // Allow -15% max
  let trendDirection = seededRandom() > 0.5 ? 1 : -1; // Up or down trend
  let hoursInTrend = 0;
  let trendDuration = 3 + Math.floor(seededRandom() * 3); // 3-5 hours per trend

  // Generate hourly data with realistic volatility
  while (currentTime <= toDate) {
    // Every 3-5 hours, change trend direction to create natural oscillations
    hoursInTrend++;
    if (hoursInTrend > trendDuration) {
      trendDirection *= -1; // Flip direction
      hoursInTrend = 0;
      trendDuration = 3 + Math.floor(seededRandom() * 3);
    }

    // Trend component: gentle 0.4-0.6% per hour (realistic daily swings ~0.4% * 24h = ~10%/day max)
    const trendComponent = trendDirection * (0.004 + seededRandom() * 0.002);
    
    // Random component: ±0.2% to add realistic noise
    const volatility = (seededRandom() - 0.5) * 0.004;
    
    const fluctuation = trendComponent + volatility;
    
    let newPrice = lastPrice * (1 + fluctuation);
    
    // Realistic bounds: ±15% from March 19 close (prevents unrealistic extremes)
    if (newPrice > maxPrice) newPrice = maxPrice;
    if (newPrice < minPrice) newPrice = minPrice;

    history.push({ symbol, timestamp: currentTime, price: newPrice });
    lastPrice = newPrice;
    currentTime += 60 * 60 * 1000; // Hourly
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

    console.log('\nPreparing assets and badges...');
    // IMPORTANT: Only delete data we're re-seeding (Feb 17 to March 21)
    // Keep all historical data before Feb 16 (10-15 years of price history)
    const FEB_16_2026 = new Date('2026-02-16T00:00:00Z').getTime();
    const FEB_17_2026 = new Date('2026-02-17T00:00:00Z').getTime();
    const MARCH_19_2026 = new Date('2026-03-19T23:59:59Z').getTime();
    const MARCH_20_2026 = new Date('2026-03-20T00:00:00Z').getTime();
    const MARCH_21_2026 = new Date('2026-03-21T00:00:00Z').getTime();
    
    // For testing: March 21, 2026 (simulating end of March 20)
    const FICTITIOUS_NOW = new Date('2026-03-21T00:00:00Z').getTime();
    
    // Delete ONLY the range we're re-seeding (Feb 17 to March 21)
    console.log(`\n🗑️  Cleaning up re-seeding range (Feb 17 → March 21)...`);
    console.log(`    (Preserving all historical data before Feb 16)`);
    
    const deleteResult = await PriceHistoryModel.deleteMany({ 
      timestamp: { $gte: FEB_17_2026, $lt: MARCH_21_2026 }
    });
    console.log(`✅ Removed ${deleteResult.deletedCount} records from Feb 17 to March 21`);
    
    // Verify cleanup
    const spokesmanCheck = await PriceHistoryModel.countDocuments({
      timestamp: { $gte: MARCH_20_2026, $lt: MARCH_21_2026 }
    });
    if (spokesmanCheck > 0) {
      console.warn(`⚠️  WARNING: Still ${spokesmanCheck} records found!`);
      const cleanup = await PriceHistoryModel.deleteMany({ 
        timestamp: { $gte: FEB_17_2026, $lt: MARCH_21_2026 }
      });
      console.log(`🗑️  Deleted ${cleanup.deletedCount} more records`);
    } else {
      console.log(`✅ Verified: Range cleaned successfully`);
    }

    console.log('\nSeeding assets...');
    const existingAssets = await AssetModel.find({});
    let assets = existingAssets;
    if (assets.length === 0) {
      assets = await AssetModel.insertMany(mockAssets);
    }
    console.log(`✅ Assets ready: ${assets.length} (should be 35)`);

    console.log('\nSeeding badges...');
    const existingBadges = await BadgeModel.find({});
    let badges = existingBadges;
    if (badges.length === 0) {
      badges = await BadgeModel.insertMany(mockBadges);
    }
    console.log(`✅ Badges ready: ${badges.length}`);

    console.log('\nUpdating price history (Feb 17 → March 19, 2026)...');
    
    const allPriceHistory: Array<{ symbol: string; timestamp: number; price: number }> = [];
    let realDataCount = 0;
    let generatedDataCount = 0;

    for (const asset of mockAssets) {
      console.log(`\n📊 Processing ${asset.symbol}...`);
      let assetHistory: Array<{ symbol: string; timestamp: number; price: number }> = [];

      if (yahooFinanceWorks) {
        try {
          // Fetch from Feb 17 to March 19 (goes backwards if no data for forward dates)
          // Yahoo Finance only has trading days, so this captures the last trading day before March 20
          console.log(`  Fetching real data from Feb 17 to March 19 (last trading day)...`);
          
          const realHistory = await fetchHistoricalData(
            asset.symbol,
            FEB_17_2026,
            MARCH_19_2026
          );

          if (realHistory.length > 0) {
            assetHistory = realHistory.map(h => ({
              symbol: asset.symbol,
              timestamp: h.timestamp,
              price: h.price,
            }));
            realDataCount += assetHistory.length;
            console.log(`  ✅ Got ${assetHistory.length} real data points (latest trading day will be used)`);
          } else {
            console.warn(`  ⚠️ No data returned for this period`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to fetch: ${error}`);
        }
      }

      // Generate fresh simulated data from March 20 onwards
      // Get the last real price to start simulation from
      let lastRealPrice = asset.initialPrice;
      let lastTimestamp = 0;
      
      if (assetHistory.length > 0) {
        lastRealPrice = assetHistory[assetHistory.length - 1].price;
        lastTimestamp = assetHistory[assetHistory.length - 1].timestamp;
        const lastDate = new Date(lastTimestamp).toISOString().split('T')[0];
        console.log(`    Last real price: $${lastRealPrice.toFixed(2)} on ${lastDate}`);
      } else {
        // Yahoo Finance failed or returned no data: query database for the most recent price before March 20
        const lastPriceInDb = await PriceHistoryModel.findOne({
          symbol: asset.symbol,
          timestamp: { $lt: MARCH_20_2026 }
        }).sort({ timestamp: -1 });
        
        if (lastPriceInDb) {
          lastRealPrice = lastPriceInDb.price;
          lastTimestamp = lastPriceInDb.timestamp;
          const lastDate = new Date(lastTimestamp).toISOString().split('T')[0];
          console.log(`    ✅ Found existing price in DB: $${lastRealPrice.toFixed(2)} on ${lastDate}`);
        } else {
          console.warn(`    ⚠️ No price data in DB, using initial price: $${lastRealPrice.toFixed(2)}`);
        }
      }

      const simulatedFromMarch20 = generateSimulatedDataFromDate(
        asset.symbol,
        lastRealPrice,
        MARCH_20_2026,
        FICTITIOUS_NOW  // Use fictional "now" for consistent test data
      );
      assetHistory.push(...simulatedFromMarch20);
      generatedDataCount += simulatedFromMarch20.length;
      
      if (simulatedFromMarch20.length > 0) {
        console.log(`    Generated ${simulatedFromMarch20.length} simulated points from March 20`);
      }

      allPriceHistory.push(...assetHistory);
    }

    console.log('\n💾 Inserting price history into database...');
    const batchSize = 1000;
    for (let i = 0; i < allPriceHistory.length; i += batchSize) {
      const batch = allPriceHistory.slice(i, i + batchSize);
      
      // Use upsert to replace existing records instead of creating duplicates
      const operations = batch.map(record => ({
        updateOne: {
          filter: { symbol: record.symbol, timestamp: record.timestamp },
          update: { $set: { price: record.price } },
          upsert: true
        }
      }));
      
      await PriceHistoryModel.bulkWrite(operations);
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
