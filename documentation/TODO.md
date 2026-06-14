E2E Verification Checklist
 1. Open http://localhost:9002/
 2. Go to /signup, test validation errors (invalid email, password '123') and take screenshot (native browser validation or client-side validation prevents submission, captured screenshot: signup_validation_errors_retest)
 3. Sign up with random email (e.g. 
test_e2e_user_715@example.com
), password 'SecurePass123!', full name 'E2E Tester'
 4. If redirected to /login, log in with credentials (it redirected to dashboard / automatically and showed welcome dialog)
 5. On Dashboard (/portfolio):
 Check Cash Balance is $10,000 and take screenshot (it is shown as $10,000.00, captured screenshot: dashboard_cash_balance)
 Look for styling errors and console warnings/errors (no console errors/warnings observed, UI looks correct)
 6. Go to /trade/AAPL:
 Try to buy -5 shares, check validation
 Try to buy 1,000,000 shares, check insufficient funds toast
 Buy 5 shares of AAPL, confirm, check cash balance updates
 Add AAPL to watchlist
 Try to sell 10 shares of AAPL, check failure
 Sell 2 shares of AAPL, confirm, check success
 7. Go to /watchlist, verify AAPL is listed
 8. Go to /history, verify transactions (buy and sell)
 9. Go to /profile, verify name and 'First Trade' badge unlocked, take screenshot
 10. Click logout
 11. Verify security (unauthenticated access to /portfolio and /trade/AAPL redirects to /login)
 12. Generate final report


  Frontend E2E Testing (Browser Subagent)
 Verify signup field validation & error messages
 Verify successful signup with new unique email
 Verify login validation errors & successful login
 Verify initial portfolio page & cash balance ($10,000)
 Claim daily reward and verify balance updates to $11,000
 Verify trade validation error cases (negative shares, zero quantity, insufficient funds)
 Perform trade buy (5 shares of AAPL) & verify holdings and cash balance update
 Add AAPL to watchlist & verify on Watchlist page
 Perform trade sell (2 shares of AAPL) & verify partial holdings and cash balance update
 Remove AAPL from watchlist & verify removal
 Verify transaction history lists both trades
 Verify user profile lists details and that the "First Trade" badge is unlocked
 Log out and verify protected route redirects
 Final Problems Reporting
 Generate PROBLEMS.md in the project root
 Clear/update progress checklist in imple-task.md

 E2E Test Checklist
 Go to signup page: http://localhost:9002/signup
 Test signup validation (empty fields, weak password, invalid email)
 Successful signup (
test_e2e_user_99540@example.com
)
 Verify initial state (Portfolio Cash Balance = $10,000)
 Claim Daily Reward (Verify Cash = $11,000)
 Verify trade validation errors (negative, zero, insufficient funds on AAPL)
 Perform successful Buy (5 shares AAPL)
 Watchlist check (Add AAPL, verify on watchlist page)
 Perform successful Sell (2 shares AAPL)
 Watchlist removal (Remove AAPL, verify removed)
 History check (Buy and Sell listed)
 Profile and Badges check ('First Trade' unlocked)
 Logout and security guards (Blocked/redirected to login)
 Screenshots taken:
 Signup page validation errors
 Initial portfolio dashboard showing $10,000 cash
 Watchlist page with AAPL
 Transaction history page
 Profile page showing the unlocked badge
 Login redirect page after logout


 E2E Test Checklist
 1. Go to signup page: http://localhost:9002/signup
 2. Test signup validation
 Click Sign Up with empty fields, verify errors
 Fill invalid email and short password, click Sign Up, verify errors
 Take screenshot of signup page with validation errors
 3. Successful signup
 Fill unique email: '
test_e2e_user_99120_238@example.com
'
 Fill password: 'TestPassword123!'
 Fill full name: 'E2E Tester'
 Click Sign Up and wait for signup/redirection
 Configure/skip onboarding wizard/modal (if any)
 4. Verify initial state
 Go to Portfolio page: http://localhost:9002/portfolio
 Verify Cash Balance is exactly $10,000
 Take screenshot of initial dashboard cash balance
 Verify no rendering errors/warnings
 5. Claim Daily Reward
 Click 'Claim Daily Reward'
 Verify cash balance increases to $11,000
 6. Verify trade page and trade validation errors
 Go to trade page for AAPL: http://localhost:9002/trade/AAPL
 Take screenshot of AAPL trade page
 Enter negative/zero shares, try to buy, verify errors
 Enter extremely large amount of shares, try to buy, verify 'insufficient funds'
 7. Perform successful Buy
 Enter '5' shares in AAPL Buy form
 Click Buy and wait for success confirmation
 Go to http://localhost:9002/portfolio
 Verify AAPL in holdings (5 shares)
 Verify cash balance decreased by 5 * AAPL price
 8. Watchlist check
 Go to http://localhost:9002/trade/AAPL
 Click 'Add to Watchlist'
 Go to http://localhost:9002/watchlist
 Verify AAPL is listed
 Take screenshot of watchlist page with AAPL
 9. Perform successful Sell
 Go to http://localhost:9002/trade/AAPL
 Enter '2' shares in Sell form, click Sell
 Wait for success confirmation
 Go to http://localhost:9002/portfolio
 Verify AAPL quantity is 3 shares, cash balance increased
 10. Watchlist removal
 Go to http://localhost:9002/watchlist
 Click 'Remove' or star icon to remove AAPL
 Refresh/verify AAPL is no longer on watchlist
 11. History check
 Go to http://localhost:9002/history
 Verify Buy (5 shares) and Sell (2 shares) in transaction history
 Take screenshot of transaction history page
 12. Profile and Badges check
 Go to http://localhost:9002/profile
 Verify user profile details displayed
 Verify 'First Trade' badge is unlocked
 Take screenshot of profile page showing unlocked badge
 13. Logout and Security guards
 Click 'Logout'
 Attempt to navigate to http://localhost:9002/portfolio, verify blocked & redirected to login
 Attempt to navigate to http://localhost:9002/trade/AAPL, verify blocked & redirected to login
 Take screenshot of redirect to login page after logout