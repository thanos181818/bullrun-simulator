# Oloo Trading Platform: Comprehensive Issues Report

This document provides a detailed analysis of the technical debt, bugs, and architectural flaws identified in the Oloo (nextn) trading platform.

---

## 1. Critical Security and Deployment Issues

### Vercel Deployment Failure (Root Layout)
The RootLayout in src/app/layout.tsx is currently marked with the 'use client' directive. Next.js requires the root layout to be a Server Component to properly handle metadata, SEO optimization, and static generation. This configuration causes 404 errors when deploying to Vercel.
- File: src/app/layout.tsx
- Impact: App cannot be deployed to production.
- Fix: Convert layout.tsx to a Server Component and move client-side providers/logic to a separate wrapper component.

### Compromised Credentials
Sensitive information, including the MONGODB_URI and GEMINI_API_KEY, was previously committed to the repository in .env.local. These keys are now visible in the Git history.
- Impact: Potential unauthorized database access and API quota abuse.
- Fix: Rotate all keys immediately and ensure .env.local is added to .gitignore. Use environment variable management in Vercel.

### Incomplete Password Recovery
The password reset flow is currently non-functional in production because the email service implementation is missing. The code contains placeholders and mock logs instead of actual email delivery.
- File: src/lib/email.ts
- Impact: Users are unable to recover lost accounts.
- Fix: Integrate a service like Resend or SendGrid and provide a valid API key.

### Duplicate Database Update Logic
The trade execution route contains a redundant update where the same field is set twice in a single MongoDB operation.
- File: src/app/api/users/[id]/execute-trade/route.ts (Line 200)
- Impact: Unnecessary code complexity and potential for future logic conflicts.
- Fix: Remove the duplicate totalReturnPercent entry.

---

## 2. High-Impact Performance Bottlenecks

### Global State Render Thrashing
The application uses Zustand for global price state, but components subscribe to the entire store object instead of specific slices.
- File: src/hooks/use-asset-prices.ts
- Impact: Every single price update (every 60 seconds) triggers a full re-render of every component using the hook, including large tables and complex charts. This causes significant UI stuttering.
- Fix: Implement strict selectors (e.g., useAssetPriceStore(state => state.assets)) to ensure components only re-render when their specific data changes.

### SVG Chart Rendering Inefficiency
Charts are rendered using Recharts, which utilizes SVG elements to draw price paths.
- File: src/components/charts/stock-chart.tsx
- Impact: For charts with hundreds of data points, the browser must recalculate and redraw the entire SVG path on every new price tick. This is computationally expensive compared to Canvas-based rendering.
- Fix: Migrate to TradingView Lightweight Charts (Canvas-based) for high-performance rendering.

### In-Memory Database Downsampling
The price history API fetches all raw records for a given period and downsamples them using JavaScript array filters.
- File: src/app/api/price-history/route.ts
- Impact: For long-term views (1Y, 5Y), the server attempts to load thousands of documents into memory. This leads to high latency, increased server costs, and potential memory crashes.
- Fix: Use MongoDB Aggregation Pipelines ($bucket) to group and average data directly on the database server.

### Browser Memory Leak
The price history cache in the browser grows indefinitely as long as the application remains open.
- File: src/hooks/use-asset-prices.ts
- Impact: Long-running sessions will eventually consume all available system RAM, causing the browser tab to crash.
- Fix: Implement a rolling window for the cache that removes the oldest data points when a maximum size is reached.

---

## 3. Reliability and Architectural Flaws

### Inconsistent User Identification
API routes inconsistently handle user lookups, sometimes requiring an email address and other times a MongoDB ObjectId.
- Impact: Increases the risk of broken links, 404 errors, and difficult-to-debug "User Not Found" scenarios.
- Fix: Standardize all API endpoints to use MongoDB ObjectId as the primary identifier.

### Missing Error Boundaries
The application lacks React Error Boundaries at both the layout and page levels.
- Impact: A single runtime error in a minor component (like a badge tooltip) will cause the entire page to turn white and crash for the user.
- Fix: Implement global and component-level Error Boundaries to gracefully handle and report failures.

### Lack of Input Validation
Most API routes process incoming request bodies without strict schema validation.
- Impact: The system is vulnerable to malformed data, which can cause unhandled server crashes or data corruption in the database.
- Fix: Use Zod to define and enforce strict schemas for all API request and response objects.

### Excessive Production Logging
The codebase contains over 40 console.error and console.log statements that are active in production.
- Impact: Exposes internal system details to users via the browser console and adds minor performance overhead.
- Fix: Replace console logs with a structured logging service like Sentry or remove them during the build process.

---

## 4. Technical Debt

### Hardcoded Configuration
Several parts of the system rely on hardcoded values, such as the development port (9002) and specific dates in March 2026 for simulation data.
- Impact: Makes the system difficult to maintain or scale to different environments.
- Fix: Move all configuration to environment variables and dynamic date calculations.

### Incomplete Internationalization
Placeholder files exist for French, German, and Chinese languages, but they do not contain actual translations.
- Impact: Provides a broken experience for non-English/Spanish users.
- Fix: Complete the translation files or remove the unsupported language options from the UI.

### Missing Automated Testing
While Jest is configured, there are no unit or integration tests for the core business logic (trade execution, profit calculation, badge awarding).
- Impact: High risk of regressions when making future changes.
- Fix: Implement a suite of automated tests for critical backend routes and utility functions.
