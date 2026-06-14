# Oloo Trading Platform: Backend Architecture and Structure

This document provides a deep dive into the backend architecture of the Oloo (nextn) trading simulator. It covers the database design, API structure, authentication, and core logic.

---

## 1. High-Level Architecture

The backend is built using the Next.js 15 App Router, which provides a serverless-friendly API layer. All backend logic resides within the `src/app/api/` and `src/lib/` directories.

- Framework: Next.js API Routes (Edge-ready)
- Database: MongoDB (hosted on MongoDB Atlas)
- ODM: Mongoose for schema-based data modeling
- Authentication: NextAuth.js with JWT strategy
- Data Fetching: External integration with Yahoo Finance for historical market data

---

## 2. Database Models and Schema Design

The application uses six primary collections in MongoDB, defined in `src/lib/models/schemas.ts`.

### User Model (UserModel)
Stores user profiles, balances, and transaction history.
- email: Unique identifier for authentication.
- cashBalance: Current virtual currency available for trading.
- portfolioValue: Total value of all holdings plus cash.
- badgeIds: Array of earned achievement IDs.
- balanceHistory: Embedded sub-documents tracking every financial movement (trades, bonuses, rewards).
- watchlist: Array of asset symbols the user is tracking.

### Asset Model (AssetModel)
Stores current market information for stocks and cryptocurrencies.
- symbol: Ticker symbol (e.g., AAPL, BTC).
- price: Last updated price.
- type: Categorized as 'stock' or 'crypto'.
- marketCap: Total market capitalization.

### Trade Model (TradeModel)
A ledger of every buy and sell order executed.
- userId: References the user who made the trade.
- assetSymbol: The ticker involved.
- orderType: 'buy' or 'sell'.
- quantity: Number of units traded.
- price: Execution price at the time of trade.
- totalAmount: quantity * price.

### Portfolio Model (PortfolioModel)
Tracks the aggregated holdings for each user.
- userId: Reference to the User.
- mode: 'simulated' (default) or 'real'.
- holdings: Array of objects containing:
  - assetSymbol: Ticker.
  - quantity: Total units held.
  - avgBuyPrice: Weighted average cost basis for profit/loss calculation.

### PriceHistory Model (PriceHistoryModel)
Stores time-series data for charting.
- symbol: Ticker.
- timestamp: Unix timestamp (ms).
- price: Price at that specific time.
- Indexing: Uses a compound index on `{ symbol: 1, timestamp: 1 }` for high-performance range queries.

### Badge Model (BadgeModel)
A static collection of all possible achievements in the system.
- id: Unique badge identifier.
- title/description: User-facing text.
- rarity: 'common', 'rare', 'epic', or 'legendary'.

---

## 3. API Endpoints Structure

The API is organized into logical sub-directories under `src/app/api/`.

### Authentication (/api/auth)
- signup/route.ts: User registration with password hashing.
- [...nextauth]/route.ts: NextAuth configuration for login and session management.
- request-reset/ and reset-password/: Password recovery flow logic.

### Market Data (/api/assets)
- route.ts: Fetches all available assets.
- [symbol]/quote/route.ts: Fetches real-time price for a single asset.
- update-prices/route.ts: Internal endpoint used to update database prices from the frontend simulator.
- price-history/route.ts: Returns time-series data for charts.

### User Actions (/api/users/[id])
- route.ts: CRUD operations for user profiles.
- portfolio/route.ts: Fetches the user's current holdings and total value.
- execute-trade/route.ts: Handles buy/sell logic using MongoDB transactions.
- balance-history/route.ts: Returns a list of all user transactions.
- claim-daily-bonus/route.ts: Implements a 24-hour cooldown for login rewards.

---

## 4. Core Backend Logic

### Trade Execution Flow
The trade execution (`/api/users/[id]/execute-trade`) is the most complex part of the backend:
1. Start Transaction: Uses a MongoDB session to ensure atomicity.
2. Balance Check: Verifies the user has enough cash (for buys) or enough units (for sells).
3. Portfolio Update: 
   - For buys: Updates the average cost basis (weighted average).
   - For sells: Reduces quantity or removes the holding if sold in full.
4. User Update: Deducts/adds cash and updates total portfolio metrics.
5. Record Trade: Creates a new entry in the Trade collection.
6. Commit Transaction: Finalizes all changes or rolls back on error.

### Achievement System
The achievement logic resides in `src/lib/badge-service.ts`. It is a server-side utility that:
- Fetches the user's entire history (trades, portfolio, balance).
- Evaluates 10+ conditional checks (e.g., "Has user made 10 trades?").
- Awards the badge and a cash reward.
- Logs the reward in the user's balance history.

### Historical Data Ingestion
The system uses Yahoo Finance via the `yahoo-finance2` library.
- Location: `src/lib/yahoofinance.ts`.
- Function: Fetches daily/weekly candles and maps them to the internal `PriceHistory` format.

---

## 5. Background Scripts and Maintenance

The `src/scripts/` directory contains standalone Node.js scripts for database maintenance:
- seed-mongodb.ts: Populates the database with initial assets.
- update-asset-prices.ts: A CLI tool to manually sync database prices with external APIs.
- nuke-history.ts: Cleans up the PriceHistory collection to prevent database bloat.
- comprehensive-tests.ts: A suite of integration tests that verify the entire backend flow without a frontend.

---

## 6. Security and Data Integrity

- Password Security: Uses `bcryptjs` with a salt factor of 10.
- Session Management: JWT-based sessions with a 24-hour expiry (managed by NextAuth).
- Atomic Operations: Extensive use of MongoDB transactions for financial data to prevent race conditions or partial updates.
- Data Validation: Currently relies on manual checks; migration to Zod for strict schema validation is recommended.
