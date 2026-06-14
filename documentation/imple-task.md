# Implementation Plan - Comprehensive E2E and Backend Testing

This plan details the steps to execute a complete and thorough test of the Next.js Bullrun Simulator website, identifying functionality issues, edge cases, build issues, unit test status, and UI/interactive bugs. Findings will be compiled into a `PROBLEMS.md` file in the project root.

## User Review Required

> [!IMPORTANT]
> - We will run the dev server on port 9002 (default in `package.json`).
> - We will create a test user to perform signup, login, trade, watchlist, profile, and logout flows.
> - The database referenced in `.env.local` (`mongodb+srv://...`) will be used. 

## Proposed Testing Procedures

### 1. Build and Static Code Verification
- Run TypeScript type checks (`npm run typecheck`) to detect code consistency/compilation errors.
- Perform a Next.js production build (`npm run build`) to ensure build-time stability, page routes generation, and tree-shaking success.

### 2. Backend and Database Logic Tests
- Run existing comprehensive backend tests (`npx tsx src/scripts/comprehensive-tests.ts`) which verify database connectivity, asset integrity, data validation, badge system, trade logic, portfolio logic, edge cases, error handling, concurrency, and performance.
- Run any Jest unit tests via `npm test`.

### 3. Frontend Interactive & E2E Testing (using Browser Subagent)
- **Authentication Flows**:
  - Sign up with empty fields (verifying validation messages).
  - Sign up with weak passwords/invalid emails.
  - Sign up with a unique random email (success path).
  - Log in with incorrect password/unregistered user.
  - Log in with newly registered user.
  - Forgot password / Reset password flow check.
- **Trading & Portfolio Flows**:
  - View trading page for stocks/cryptocurrencies.
  - Purchase assets with sufficient funds (verifying transaction reflects on portfolio).
  - Sell partial holding (verifying cash balance changes).
  - Sell full holding (verifying asset is removed from portfolio).
  - Attempt to purchase assets with insufficient funds (verifying rejection/error display).
  - Attempt invalid inputs (fractional stock shares if unsupported, zero quantity, negative values).
- **Dashboard & Portfolio Verification**:
  - Check total value, performance charts, and average buy price updates.
  - Verify holding statistics.
- **Watchlist Page**:
  - Add assets to watchlist, verify styling (star/icon updates).
  - Go to watchlist page and check presence.
  - Remove from watchlist and verify removal.
- **History & Achievements**:
  - Go to transaction history page, check if buy/sell trades are recorded correctly.
  - Earn/unlock badges (e.g. "first_trade") and check user profile for badge completion.
- **Security Check (Auth Middleware)**:
  - Attempt direct URL access to protected routes (`/portfolio`, `/trade`, `/profile`) after logging out to see if middleware blocks and redirects.
- **Aesthetic and UI Polish Checks**:
  - Look for broken styles, overlapping layouts, non-responsive viewport displays, console warnings, and slow rendering.

### 4. Problem Reporting
- Compile all found failures, warnings, design issues, and console errors into [PROBLEMS.md](file:///c:/Users/sm091/Videos/oloo-main-without-courses/oloo-main/PROBLEMS.md).

## Verification Plan

### Automated Tests
- Run `npm run typecheck`
- Run `npm run build`
- Run `npm test`
- Run `npx tsx src/scripts/comprehensive-tests.ts`

### Manual Verification (via Browser Subagent)
- E2E checklist in browser: Registration -> Login -> Watchlist -> Trade Buy -> Trade Sell -> History -> Profile/Badges -> Logout -> Path Bypass Block.


- [x] Run typescript typecheck (`npm run typecheck`) [PASSED - Fixed all compiler errors in schemas, models, components, routes, and scripts]
- [x] Run project build (`npm run build`) [PASSED - Clean compilation and optimization]
- [x] Run unit tests (`npm test`) [PASSED - Fixed badge-service mock sequence mismatch]
- [x] Run backend comprehensive tests (`npx tsx src/scripts/comprehensive-tests.ts`) [COMPLETED - 1072/1105 passed, 33 failed. Failed: Badge collection size (<50), 30 Division-by-zero tests (faulty assertion in test script itself), 1 String length 0 test, 1 Performance latency test]
- [x] Run Next.js dev server and execute browser-based E2E tests
  - [x] Auth validation & creation
  - [x] Login flow
  - [x] Portfolio / Dashboard verification
  - [x] Buy/sell trades (valid and boundary cases)
  - [x] Watchlist addition and removal
  - [x] Achievements/badges unlock check
  - [x] Protected route bypass checks
- [x] Compile problems list into `PROBLEMS.md`

# E2E Testing Plan

- [x] Open http://localhost:9002/ (Loading state checked)
- [x] Sign up:
    - [x] Try weak password/invalid email (Check validation errors)
    - [x] Sign up with valid credentials (e.g., test_e2e_user_1234@example.com)
- [x] Login with the new user
- [x] Portfolio validation:
    - [x] Cash balance is $10,000
    - [x] No rendering bugs/console errors
- [x] Trade validation:
    - [x] Buy 5 shares of AAPL (Verify transaction & cash decrease)
    - [x] Buy 1,000,000 shares (Verify blocked)
    - [x] Sell 2 shares of AAPL (Verify success)
    - [x] Add AAPL to watchlist
- [x] Watchlist validation (Verify AAPL is shown)
- [x] History validation (Verify buy and sell listed)
- [x] Profile validation (Verify name & 'First Trade' badge)
- [x] Logout and security check (Access portfolio/trade directly and verify redirection)
