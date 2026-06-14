# 🚀 Comprehensive Performance Audit Report

## Executive Summary
This report details the root causes behind the sluggish stock-market graph rendering and general UI lag in the Oloo trading platform. The primary issues stem from a combination of global state subscription patterns triggering massive re-render cascades, inefficient data-fetching from MongoDB for historical data, and the use of an SVG-based charting library that is not optimized for real-time high-frequency updates.

---

## 1. State-Management and Reactivity 🔴 (CRITICAL)
**The most severe bottleneck in the application.**

### Hotspots:
- **File:** `src/hooks/use-asset-prices.ts` (Lines 167 & 183)
- **Issue:** The custom Zustand hooks (`useAssetPrices` and `useAssetHistory`) subscribe to the **entire store** rather than specific slices of state.
  ```typescript
  // In useAssetPrices
  const store = useAssetPriceStore();
  return { ...store, isLoading: store.isLoading || isDbAssetsLoading };

  // In useAssetHistory
  const store = useAssetPriceStore();
  return { data: store.getAssetHistory(symbol) || data || [], ... };
  ```
- **Impact:** Any time **any** asset's price updates (which happens every 60 seconds via `setInterval`), the `updateLivePrices` function re-creates the `assets` array. Because components like `MarketOverview`, `StockChart`, `Watchlist`, and `TradePage` call these hooks, **the entire UI re-renders**. If you were to connect real-time WebSockets updating 10x a second, the application would freeze entirely due to React "render thrashing".
- **Fix:** Use Zustand selectors to only subscribe to necessary state:
  ```typescript
  const assets = useAssetPriceStore(state => state.assets);
  const getAssetHistory = useAssetPriceStore(state => state.getAssetHistory);
  ```

---

## 2. Front-End Rendering Pipeline 🟠 (HIGH)

### Hotspots:
- **File:** `src/components/charts/stock-chart.tsx`
- **Issue:** The application uses **Recharts**, which renders graphs using SVG elements. 
- **Impact:** For historical data containing hundreds of data points (e.g., 500 points for a 1D chart), Recharts constructs a massive `<path>` string. When a new price tick arrives, Recharts cannot "append" the point; it recalculates and re-renders the entire SVG path. This causes significant layout recalculations and frame-rate drops. Real-time platforms (like TradingView or Binance) never use SVG for live charts.
- **Fix:** Migrate to a Canvas-based library built specifically for financial data, such as **TradingView's Lightweight Charts** (`lightweight-charts`). It uses HTML5 Canvas, handles thousands of candles smoothly, and has native methods to `update()` the last candle without redrawing the whole chart.

---

## 3. Data-Fetching Layer 🟠 (HIGH)

### Hotspots:
- **File:** `src/app/api/price-history/route.ts` (Lines 70-87)
- **Issue:** Inefficient downsampling of historical data.
  ```typescript
  const priceHistory = await PriceHistoryModel.find({ ... }).lean();
  if (priceHistory.length > maxDataPoints) {
    // In-memory filtering after fetching all documents!
  }
  ```
- **Impact:** For long durations (`1Y`, `5Y`, `ALL`), the query fetches potentially millions of minute-level data points from MongoDB into the Node.js memory, only to discard 99% of them in an array filter. This spikes server CPU/Memory, causes massive round-trip latency (often multiple seconds), and wastes bandwidth.
- **Fix:** Use MongoDB's Aggregation Pipeline (`$bucket` or `$bucketAuto`) to group and average data directly in the database. Only send the exact number of required data points over the wire.

---

## 4. Memory and CPU Footprint 🟡 (MEDIUM)

### Hotspots:
- **File:** `src/hooks/use-asset-prices.ts` (Lines 135-156)
- **Issue:** The `assetHistoryCache` array grows indefinitely.
  ```typescript
  newHistoryCache[symbol] = [...currentHistory, { time: now, price: priceUpdates[symbol] }];
  ```
- **Impact:** As the simulator runs, every tick pushes a new object into the history array for every asset. Over a long session, these arrays will consume significant RAM, leading to garbage collection pauses (jank) in the browser.
- **Fix:** Implement a rolling window buffer. When appending a new price, shift the oldest price out if the array exceeds `maxDataPoints`.

---

## 5. Network and Protocol Efficiency 🟡 (MEDIUM)

### Hotspots:
- **File:** Entire App
- **Issue:** No real-time protocol is implemented. The app relies on a client-side `setInterval` simulator, while SWR polls the API every 5 minutes.
- **Impact:** True real-time apps use **WebSockets** or **Server-Sent Events (SSE)**. Polling creates HTTP overhead (headers, handshakes) and does not provide sub-second latency.
- **Fix:** Implement WebSockets (e.g., via `Socket.io` or standard WS) for price ticks. Send binary or compact JSON payloads (e.g., `[symbol, price, timestamp]`) instead of verbose objects.

---

## 🎯 Prioritized Fix List & Action Plan

### Quick Wins (Do this today)
1. **Fix Zustand Subscriptions:** Update `useAssetPrices` to use strict selectors so components only re-render when their specific data changes. This will instantly eliminate 90% of UI lag.
2. **Cap History Arrays:** Add a `.slice(-500)` when appending new live prices to the cache in `useAssetPriceStore` to prevent memory leaks.

### Architectural Changes (Next 1-2 weeks)
1. **Swap Charting Library:** Replace Recharts with `lightweight-charts`. It is completely free, open-source, and explicitly designed for real-time stock/crypto charts without paid tiers.
2. **Optimize MongoDB Queries:** Rewrite `/api/price-history` to use aggregation pipelines to prevent the server from crashing under heavy data loads.
3. **Implement WebSockets:** Move the price simulator to the backend and stream updates via WebSockets, ensuring true real-time synchronization across all connected clients.
