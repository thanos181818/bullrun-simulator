# Oloo Trading Platform: Full Implementation Report

This document provides a comprehensive technical breakdown of the Oloo (nextn) trading simulator. It covers the architecture, features, data flow, and current state of the implementation as of June 2026.

---

## 1. Technical Architecture and Tech Stack

The platform is built as a modern, full-stack Next.js application designed for high-performance UI and real-time data simulation.

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: MongoDB (via Mongoose)
- Authentication: NextAuth.js
- State Management: Zustand (Global Store) and SWR (Server State/Polling)
- AI Engine: Google Genkit (Gemini 1.5 Flash)
- UI and Styling: 
  - Tailwind CSS (Utility-first styling)
  - Shadcn UI (Radix-based accessible components)
  - Framer Motion (Animations)
  - Lucide React (Icons)
- Charts: Recharts (SVG-based)
- Data Source: Yahoo Finance (via yahoo-finance2 for historical data)

---

## 2. Authentication and User Management

### Flow:
1. Signup: Users create an account via /api/auth/signup. Passwords are hashed using bcryptjs.
2. Login: Managed by NextAuth.js with a Credentials provider. Session data is stored in JWT/Cookies.
3. Password Reset (Incomplete): 
   - A forgot-password page exists at /forgot-password.
   - /api/auth/request-reset handles the request but currently has a TODO for the email service implementation.
   - /api/auth/reset-password handles the actual update.
4. Profile: Users can manage their theme, view their balance history, and see earned badges.

---

## 3. Market Data and Price Simulation

### Data Sources:
- Historical Data: Fetched from Yahoo Finance using the yahoo-finance2 library. This is used to populate the PriceHistory collection in MongoDB.
- Real-Time Simulation: 
  - A client-side Singleton Price Simulator in src/hooks/use-asset-prices.ts.
  - It generates price movements using a random-walk algorithm with volatility constants (Crypto: ~0.8%, Stocks: ~0.2% per update).
  - It includes a Trending Logic that flips directions every 3-5 hours to simulate market cycles.

---

## 4. Trading and Portfolio System

### Features:
- Execution: Users can Buy/Sell assets via the Trade page (/trade/[symbol]).
- Simulated Mode: All trades are currently simulated using virtual currency.
- Transaction Safety: Trades use MongoDB Transactions (withTransaction) to ensure that user balance and portfolio holdings are updated atomically.
- Balance History: Every trade, deposit, or bonus claim is logged in a balanceHistory array within the User document.
- Transaction Types: The system tracks different transaction types:
  - trade: Buying or selling assets.
  - achievement: Cash rewards from earning badges.
  - bonus: Daily login rewards.
  - deposit: Manual fund additions.

### Edge Cases Handled:
- Insufficient funds for buying.
- Attempting to sell more than the user owns.
- Handling both Email and ObjectId for user identifier in API routes.
- Downsampling of price history data based on the selected time range (e.g., 6H, 1D, 1W) to maintain chart performance.

---

## 5. Gamification: Badge System

Located in src/lib/badge-service.ts, the system automatically awards badges based on user milestones and provides cash rewards.

### Badge Logic:
- First Trade: Awarded on the first successful trade execution.
- Active Trader: Awarded after completing 10 trades.
- High Roller: Awarded for a single trade exceeding $10,000.
- Crypto Pioneer: Awarded for the first trade involving a cryptocurrency.
- Stock Specialist: Awarded for the first trade involving a stock.
- Diversifier: Awarded for holding 5 or more different assets in the portfolio.
- Dollar Millionaire: Awarded when the portfolio value reaches $1,000,000.
- Megawhale: Awarded for a single trade exceeding $50,000.
- Cash Collector: Awarded after earning $100,000 in total cash rewards.
- Profit Master: Awarded after making $50,000 in total trading profit.
- Comeback Kid: Awarded for recovering to a positive total return after a 50% portfolio drop.

### Rewards:
- Common: $500
- Rare: $1,000
- Epic: $2,500
- Legendary: $5,000

---

## 6. Onboarding: Trading Tutorial

The platform includes an interactive step-by-step tutorial (src/components/shared/trading-tutorial.tsx) to guide new users.

### Tutorial Steps:
1. Welcome: Introduction to paper trading.
2. Market Overview: Explaining real-time market data and trending assets.
3. Watchlist: How to track favorite assets using the star icon.
4. Portfolio: Monitoring holdings and profit/loss performance.
5. Balance and Rewards: Managing cash and claiming daily bonuses.
6. Completion: Instructions for quick-trade (T) and keyboard shortcuts (?).

The tutorial uses a spotlight effect to highlight specific UI elements and tracks completion status in localStorage per user.

---

## 7. AI Trading Insights

Powered by Google Genkit, the platform provides AI-driven market sentiment analysis.

- Flow:
  - The ai-trading-insights flow takes market data and user portfolio info.
  - It generates a summary of market conditions and personalized advice.
  - Displayed in the AI Insights component on the dashboard.

---

## 8. Internationalization (i18n) and UI

- Localization: Uses next-intl with JSON files for English, Spanish, German, French, and Chinese.
- Theming: Integrated next-themes supporting Light, Dark, and System modes.
- Responsive Design: Mobile-first approach using Tailwind's breakpoints and a collapsible sidebar.
- Keyboard Shortcuts: A dedicated provider (src/components/shared/keyboard-shortcuts-provider.tsx) handles global shortcuts:
  - T: Open trade dialog.
  - ?: Show shortcuts modal.
  - ESC: Close modals.

---

## 9. Current Errors and Issues

### Critical Issues
1. Vercel Deployment Issue: The RootLayout is currently a Client Component ('use client'), which breaks Vercel's metadata and SEO optimization. This results in 404 errors on deployment.
2. Exposed Credentials: .env.local contains live API keys and MongoDB connection strings that were previously committed to the repository.
3. Duplicate Field Update: In execute-trade route, totalReturnPercent is set twice in the same update object (src/app/api/users/[id]/execute-trade/route.ts:L200).
4. Missing Email Service: Password reset functionality is incomplete because the email service (Resend/SendGrid) is not implemented.

### Performance and Reliability Issues
5. State Management Bottleneck: Zustand subscriptions in useAssetPrices are not sliced, causing the entire application to re-render whenever any asset price changes.
6. Chart Rendering Lag: Charts use Recharts (SVG), which recalculates the entire SVG path on every price tick. This is inefficient for real-time data.
7. Database Efficiency: The price-history API fetches thousands of rows and downsamples them in JavaScript instead of using MongoDB aggregation pipelines ($bucket).
8. Memory Leak: The price history cache in use-asset-prices.ts grows indefinitely, consuming excessive RAM over time.
9. Simulation Timer Cleanup: The price simulation timer may not cleanup properly on component unmount, leading to multiple timers running simultaneously.

### High Priority Issues
10. Inconsistent User ID Handling: API routes accept both email and ObjectId as user identifiers, leading to potential bugs and inconsistent design.
11. No Error Boundaries: Missing React error boundaries at layout and page levels, causing the whole app to crash on component errors.
12. Excessive Logging: Over 40 console.error statements remain in the codebase, which should be moved to a proper logging service.
13. No Request Validation: API routes lack input validation (e.g., Zod), making them vulnerable to malformed requests.
14. Database Connection Race Conditions: MongoDB connection caching in src/lib/mongodb.ts may cause race conditions in serverless environments.

---

## 10. Styling Conventions

- Colors: Uses HSL variables defined in globals.css (e.g., --primary, --background).
- Glassmorphism: Extensive use of backdrop-blur and semi-transparent borders for a modern fintech feel.
- Animations: 
  - framer-motion for layout transitions.
  - Custom CSS animations for glow-pulse effects on watchlist items.
  - canvas-confetti for celebratory moments (winning badges).

---

## 11. Maintenance and Test Scripts

Located in src/scripts/, these utilities handle database management and verification.

- seed-mongodb.ts: Initial database seeding with assets and default data.
- update-asset-prices.ts: Script to manually trigger price updates in the database.
- nuke-history.ts: Utility to clear old price history records.
- comprehensive-tests.ts: Integration tests for trade execution, badge awarding, and balance updates.
- verify-current-db.ts: Checks database integrity and index status.

---

## 12. Future Roadmap (Recommended)

- Migrate to Canvas: Switch Recharts to TradingView Lightweight Charts for 60FPS performance.
- WebSockets: Replace SWR polling with a real-time WebSocket stream for price updates.
- Zod Validation: Add strict input validation to all API routes.
- Email Service: Connect Resend/SendGrid for real password resets.
- Error Boundaries: Implement React Error Boundaries to prevent full-app crashes.
