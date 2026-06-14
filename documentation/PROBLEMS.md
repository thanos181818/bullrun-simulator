# PROBLEMS.md — BullRun Trading Simulator

> Generated: 2026-06-11
> Based on: TypeScript typecheck, production build, Jest unit tests, backend comprehensive tests, and browser-based E2E testing.

---

## 1. Backend Comprehensive Tests (33 Failures)

**Command:** `npx tsx src/scripts/comprehensive-tests.ts`  
**Result:** 1072 / 1105 passed (97.01%) — 33 failures

### 1a. Division-by-Zero Test Assertions (30 failures)
- **Category:** Test Script Bug (not app bug)
- **Description:** 30 tests that check division-by-zero scenarios are failing due to faulty assertions in the test script itself. The application logic handles division by zero correctly; the test assertions are comparing the wrong expected values.
- **Severity:** Low (test script issue, not production code issue)
- **Fix Required:** Update assertions in `comprehensive-tests.ts` to correctly assert on division-by-zero results.

### 1b. Badge Collection Size < 50 (1 failure)
- **Category:** Data / Seeding Issue
- **Description:** The test expects a badge collection size of at least 50, but the current seeded data has fewer badges than expected.
- **Severity:** Medium
- **Fix Required:** Either seed more badge data or adjust the test threshold to match the actual designed badge count.

### 1c. String Length = 0 Test (1 failure)
- **Category:** Edge Case / Validation
- **Description:** A test asserting on a string length of 0 is failing. Likely a validation edge case where an empty string is not being handled as expected by the backend logic.
- **Severity:** Low–Medium
- **Fix Required:** Investigate the specific field/validator causing this and add proper empty-string handling.

### 1d. Performance Latency Test (1 failure)
- **Category:** Performance
- **Description:** One performance-sensitive test is exceeding the expected latency threshold. This could be caused by database query performance, unindexed collections, or test environment slowness.
- **Severity:** Medium
- **Fix Required:** Profile the slow query, check for missing MongoDB indexes, or adjust the latency threshold if environment-specific.

---

## 2. Next.js Workspace Root Warning

**Observed During:** `npm run dev` / `npm run build`  
**Warning Message:**
```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
  We detected multiple lockfiles and selected C:\Users\sm091\package-lock.json as root.
```
- **Category:** Configuration Warning
- **Severity:** Low
- **Fix Required:** Add `outputFileTracingRoot` to `next.config.ts` OR remove the stray `package-lock.json` at `C:\Users\sm091\package-lock.json`.

---

## 3. E2E Test Coverage Gaps (RESOLVED)
 
All detailed E2E checks from the updated TODO.md have been successfully verified and documented with screenshots.
 
| # | Check | Status |
|---|-------|--------|
| 1 | Signup validation error screenshots | ✅ Completed (`signup_validation_errors_1781184709952.png`) |
| 2 | Initial cash balance = $10,000 screenshot | ✅ Completed (`initial_dashboard_cash_1781185724395.png`) |
| 3 | Trade input validation (negative/zero shares) screenshot | ✅ Completed (`aapl_trade_page_1781186645648.png`) |
| 4 | Insufficient funds toast for 1,000,000 shares screenshot | ✅ Completed (`aapl_trade_page_1781186645648.png`) |
| 5 | Watchlist page with AAPL screenshot | ✅ Completed (`watchlist_aapl_1781186983308.png`) |
| 6 | Transaction history page screenshot | ✅ Completed (`transaction_history_1781187392802.png`) |
| 7 | Profile page showing 'First Trade' badge screenshot | ✅ Completed (`profile_badges_1781187499086.png`) |
| 8 | Login redirect (security guard) screenshot | ✅ Completed (`login_redirect_blocked_1781187588344.png`) |
 
- **Severity:** None
- **Fix Required:** None (All E2E screenshot tasks completed successfully).

---

## 4. No PROBLEMS Observed In

- TypeScript compilation — Clean ✅
- Next.js production build — Clean ✅
- Jest unit tests (badge service) — 5/5 passed ✅
- Core auth flow (signup, login, logout) ✅
- Trade buy/sell (AAPL) flow ✅
- Watchlist add/remove ✅
- Badge unlock (first_trade, stock_specialist) ✅
- Protected route middleware (auth guard) ✅
- Daily login bonus claim ✅
