
import type {
  Asset,
  Badge,
  Module,
  Quiz,
} from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const mockModules: Module[] = [
  {
    id: 'intro-trading',
    title: 'Introduction to Trading',
    description: 'Learn the fundamental concepts of trading and financial markets.',
    orderIndex: 1,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-intro')?.imageUrl || '',
    curriculum: [
      {
        id: 'intro-1',
        type: 'content',
        title: 'What is a Market?',
        content: `<h4>The Foundation of Trading</h4>
<p>A financial market is a dynamic environment where buyers and sellers meet to trade financial assets like stocks, bonds, and cryptocurrencies. Think of it as a massive, global auction house where the value of assets is determined by the constant tug-of-war between supply and demand. The core purpose is to facilitate efficient price discovery—determining what an asset is truly worth at any given moment.</p>
<h4>Key Market Concepts:</h4>
<ul>
  <li><b>Liquidity:</b> This is arguably the most important characteristic of a healthy market. It refers to how quickly and easily an asset can be bought or sold without causing a significant change in its price. High liquidity (like in major stocks such as Apple or Microsoft) means there are many buyers and sellers, so trades are fast and prices are stable. Low liquidity (common in small, obscure assets) means it can be hard to find a buyer when you want to sell, and the price might drop significantly just from your single trade.</li>
  <li><b>Volatility:</b> This measures how much an asset's price fluctuates over time. High volatility (common in crypto) means prices can swing dramatically up and down, offering the potential for high returns but also carrying a very high risk. Low volatility, found in assets like government bonds or large utility stocks, means prices are more stable and predictable.</li>
  <li><b>Market Capitalization (Market Cap):</b> This is the total market value of a company's outstanding shares or a cryptocurrency's coins in circulation. It's calculated by multiplying the asset's current price by the total number of shares/coins. It's a quick way to gauge the size and significance of an asset. Assets are often categorized as Large-Cap (e.g., >$10B), Mid-Cap ($2B-$10B), and Small-Cap (<$2B).</li>
</ul>`,
      },
      {
        id: 'intro-2',
        type: 'content',
        title: 'Stocks vs. Cryptocurrencies',
        content: `<h4>Two Different Worlds of Investment</h4>
<p>While both stocks and cryptocurrencies are tradable assets, their fundamental nature, regulation, and value drivers are vastly different. Understanding this distinction is critical for any investor.</p>
<p><b>Stocks (Equities):</b></p>
<ul>
  <li><b>Ownership and Value:</b> A stock represents a slice of ownership in a publicly-traded company. Its value is intrinsically linked to the company's performance, including its revenue, earnings, debt, and future growth prospects. When you own a stock, you own a claim on the company's assets and a share of its profits.</li>
  <li><b>Regulation and Structure:</b> The stock market is a highly regulated environment, with bodies like the SEC in the United States overseeing operations to protect investors. Trading occurs during specific market hours (e.g., 9:30 AM to 4:00 PM EST).</li>
</ul>
<p><b>Cryptocurrencies:</b></p>
<ul>
  <li><b>Decentralized and Digital:</b> Cryptocurrencies are digital or virtual tokens secured by cryptography. They operate on a decentralized network (a blockchain), meaning no single entity like a government or bank is in control.</li>
  <li><b>Value Drivers:</b> Their value is primarily driven by supply and demand, community adoption, the utility of their network (e.g., for smart contracts), and market speculation. There is often no underlying physical asset or cash flow.</li>
  <li><b>Market Environment:</b> Crypto markets are open 24/7 and are generally less regulated than traditional financial markets, which leads to higher volatility and unique risks.</li>
</ul>`,
      },
      {
        id: 'intro-3',
        type: 'content',
        title: 'Understanding Order Types',
        content: `<h4>How You Interact With the Market</h4>
<p>Placing an order is your direct instruction to a broker or exchange to buy or sell an asset. Knowing the basic types is essential for controlling your trades and managing risk.</p>
<ul>
  <li><b>Market Order:</b> The simplest and most common type. It's an instruction to buy or sell immediately at the best available current price. Its advantage is that the trade is guaranteed to execute quickly. Its disadvantage is that you don't know the exact price you'll get, which can be a problem in highly volatile markets. <strong>This is the order type used in the BullRun simulation for simplicity.</strong></li>
  <li><b>Limit Order:</b> An order to buy or sell at a specific price or better. A buy limit order can only execute at the limit price or lower, and a sell limit order can only execute at the limit price or higher. This gives you control over the price but does not guarantee execution—if the asset never reaches your limit price, the order will not be filled.</li>
  <li><b>Stop-Loss Order:</b> A crucial risk management tool. It's an order to sell an asset when it reaches a certain lower price. It's designed to limit an investor's loss on a position. For example, if you buy a stock at $50, you could place a stop-loss at $45 to automatically sell if it drops, preventing further losses. It's like an insurance policy against a large downturn.</li>
</ul>`,
      },
      {
        id: 'intro-quiz-1',
        type: 'quiz',
        title: 'Introductory Concepts Quiz',
      }
    ]
  },
  {
    id: 'tech-analysis',
    title: 'Technical Analysis',
    description: 'Master the art of chart patterns, indicators, and price action.',
    orderIndex: 2,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-technical')?.imageUrl || '',
    curriculum: [
      {
        id: 'ta-1',
        type: 'content',
        title: 'The Philosophy of Technical Analysis',
        content: `<h4>Reading the Story of the Market</h4>
<p>Technical analysis is the study of historical price action and volume to identify patterns and forecast future price movements. It operates on three core principles that every technical trader lives by:</p>
<ol>
  <li><b>The market discounts everything:</b> This is the cornerstone of technical analysis. It means that all known information—from company earnings and economic data to news headlines and investor sentiment—is already reflected in the asset's current price. Therefore, analyzing the price itself is a shortcut to analyzing all the factors that influence it.</li>
  <li><b>Price moves in trends:</b> Technical analysts believe that prices tend to move in recognizable directions (up, down, or sideways) for periods of time. The primary goal of a technical trader is to identify the current trend and trade with it, not against it.</li>
  <li><b>History repeats itself:</b> Chart patterns and market behaviors tend to repeat over time. This is because these patterns are rooted in human psychology—specifically, the emotions of fear and greed—which has remained consistent for centuries. By recognizing patterns that have occurred in the past, traders can anticipate potential future movements.</li>
</ol>
<p>In essence, technical traders believe that <em>how</em> the price moves is more important than <em>why</em> it moves.</p>`
      },
      {
        id: 'ta-2',
        type: 'content',
        title: 'Support and Resistance',
        content: `<h4>The Battleground of Price Action</h4>
<p>Support and resistance are the most fundamental concepts in technical analysis. They represent key price levels where the forces of supply and demand meet, creating barriers to price movement.</p>
<p><b>Support:</b> A price level where a downtrend is expected to pause due to a concentration of demand (buyers). Imagine it as a floor that has historically prevented the price from falling further. When price approaches a support level, buyers see it as a bargain and tend to step in, overwhelming sellers and pushing the price back up.</p>
<p><b>Resistance:</b> The opposite of support. It's a price level where an uptrend is expected to pause due to a concentration of supply (sellers). Think of it as a ceiling that the price has difficulty breaking through. As the price approaches resistance, sellers tend to take profits, overwhelming buyers and pushing the price back down.</p>
<p>A key principle is that once a resistance level is broken, it often becomes a new support level. Conversely, if a price falls through a support level, that level can become a new resistance. Identifying these levels is crucial for setting entry points, stop-losses, and profit targets.</p>`
      },
      {
        id: 'ta-3',
        type: 'content',
        title: 'Interpreting Moving Averages',
        content: `<h4>Smoothing the Noise to Find the Trend</h4>
<p>A moving average (MA) is a widely used technical indicator that smooths out price action by calculating an average price over a specific number of periods. It helps traders identify the direction of the underlying trend without being distracted by short-term volatility.</p>
<ul>
  <li><b>Simple Moving Average (SMA):</b> A straightforward average of the closing prices over 'n' periods. For example, a 50-day SMA adds up the last 50 closing prices and divides by 50. It gives equal weight to all data points.</li>
  <li><b>Exponential Moving Average (EMA):</b> A type of moving average that gives more weight to the most recent prices. This makes it more responsive to new information and sudden price changes, which is why many traders prefer it.</li>
</ul>
<p>Traders often watch for "crossovers" between different MAs. A "Golden Cross" occurs when a short-term MA (like the 50-day) crosses above a long-term MA (like the 200-day), which is widely seen as a strong bullish signal. A "Death Cross" is the opposite—the short-term MA crosses below the long-term MA—and is considered a very bearish signal.</p>`
      },
      {
        id: 'ta-quiz-1',
        type: 'quiz',
        title: 'Technical Analysis Quiz',
      }
    ]
  },
  {
    id: 'crypto-basics',
    title: 'Cryptocurrency Basics',
    description: 'Dive into the world of digital currencies and blockchain technology.',
    orderIndex: 3,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-crypto')?.imageUrl || '',
    curriculum: [
      {
        id: 'cb-1',
        type: 'content',
        title: 'What is Blockchain?',
        content: `<h4>The Revolutionary Technology Behind Crypto</h4>
<p>A blockchain is a decentralized, distributed, and immutable digital ledger used to record transactions across many computers. Let's break that down:</p>
<ul>
  <li><b>Decentralized & Distributed:</b> Instead of being stored in one central location (like a bank's server), the ledger is copied and spread across a vast network of computers. This means no single person or group has control—the power is distributed. To take down or corrupt the network, you'd have to attack thousands of computers simultaneously, making it incredibly secure and resilient.</li>
  <li><b>Immutable:</b> Once a transaction is recorded in a "block" and added to the "chain," it is permanent and cannot be altered or deleted. Each new block is cryptographically linked to the previous one, creating a secure and unchangeable chain of records. This feature is what guarantees the integrity of the transaction history.</li>
</ul>
<p>This technology is what allows cryptocurrencies to exist and be transferred peer-to-peer without needing a trusted central authority like a bank to verify and settle transactions.</p>`
      },
      {
        id: 'cb-2',
        type: 'content',
        title: 'Understanding Wallets and Keys',
        content: `<h4>How to Secure Your Digital Assets</h4>
<p>A common misconception is that a crypto wallet "holds" your coins. In reality, your coins always exist on the blockchain. Your wallet holds your <strong>keys</strong>, which are the cryptographic pieces of information that prove ownership and allow you to access and manage your funds.</p>
<ul>
  <li><b>Public Key:</b> Think of this like your bank account number. You can share it freely with others to receive funds. It is generated from your private key, but the private key cannot be derived from it.</li>
  <li><b>Private Key:</b> This is the most important piece of information. It's a secret, complex password that gives you the ability to authorize and sign transactions, effectively spending your crypto. <strong>You must never share your private key with anyone.</strong> If you lose it, you lose access to your funds forever. "Not your keys, not your coins" is a popular mantra in the crypto space.</li>
</ul>
<p><b>Hot Wallets</b> are software wallets connected to the internet (e.g., mobile apps, browser extensions). They are convenient for frequent trading but are more vulnerable to online attacks. <b>Cold Wallets</b> are offline physical devices (like a USB stick) that store your keys. They are the most secure way to store large amounts of crypto long-term, as they are immune to remote hacking.</p>`
      },
      {
        id: 'cb-3',
        type: 'content',
        title: 'Bitcoin vs. Ethereum',
        content: `<h4>The Two Giants of the Crypto World</h4>
<p>While often mentioned together, Bitcoin and Ethereum serve fundamentally different purposes.</p>
<p><b>Bitcoin (BTC):</b></p>
<ul>
  <li><b>The Original & Digital Gold:</b> Created in 2009, Bitcoin was the first decentralized digital currency. Its primary use case has evolved to be a "store of value," similar to digital gold. It's seen as a hedge against inflation and currency debasement due to its fixed, predictable supply of only 21 million coins.</li>
  <li><b>Function:</b> Its blockchain is highly optimized for one thing: securely and reliably processing Bitcoin transactions in a decentralized manner. It is not designed for complex applications.</li>
</ul>
<p><b>Ethereum (ETH):</b></p>
<ul>
  <li><b>The World Computer & Smart Contracts:</b> Launched in 2015, Ethereum introduced the revolutionary concept of <strong>smart contracts</strong>. These are self-executing contracts with the terms of the agreement directly written into code, running on the blockchain.</li>
  <li><b>Primary Use Case:</b> It's a global, open-source platform for building and running decentralized applications (dApps). This has given rise to entire ecosystems like Decentralized Finance (DeFi), NFTs, and blockchain gaming.</li>
  <li><b>Function:</b> Its native token, Ether (ETH), is used as "gas" to pay for transaction fees and computational services on the network. It's the fuel that powers the Ethereum ecosystem.</li>
</ul>`
      },
      {
        id: 'cb-quiz-1',
        type: 'quiz',
        title: 'Crypto Concepts Quiz',
      }
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Understand how to protect your capital and manage portfolio risk.',
    orderIndex: 4,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-risk')?.imageUrl || '',
    curriculum: [
      {
        id: 'rm-1',
        type: 'content',
        title: 'The #1 Rule: Protect Your Capital',
        content: `<h4>Staying in the Game is Winning</h4>
<p>In the world of trading and investing, the single most important rule is not about making money—it's about not losing it. Capital preservation is the foundation upon which all successful trading careers are built. No trader, no matter how skilled, wins every trade. The key to long-term success is to ensure that your winning trades are bigger than your losing trades, and more importantly, that no single loss (or series of losses) can knock you out of the game entirely.</p>
<h4>The Math of Losses:</h4>
<ul>
  <li>A 10% loss requires an 11% gain to get back to even.</li>
  <li>A 25% loss requires a 33% gain to get back to even.</li>
  <li>A 50% loss requires a 100% gain just to break even.</li>
</ul>
<p>This "asymmetric pain" of losses demonstrates why protecting your capital is paramount. Risk management provides the discipline necessary to survive market volatility and the inevitable losing streaks.</p>`
      },
      {
        id: 'rm-2',
        type: 'content',
        title: 'Position Sizing: How Much to Risk?',
        content: `<h4>The Most Important Decision in a Trade</h4>
<p>Position sizing is one of the most critical and overlooked skills in trading. It answers the question: "How many shares or coins should I buy?" The answer isn't about how many you can afford, but about how much of your total capital you are willing to lose if this specific trade goes against you.</p>
<p>A widely respected guideline is the <b>1% Rule</b>. This rule states that you should never risk more than 1% of your total trading capital on a single trade. For example:</p>
<ul>
  <li>If your portfolio is $100,000, you should risk no more than $1,000 on one trade.</li>
  <li>This doesn't mean you can only buy $1,000 worth of stock. It means the potential loss you're willing to accept (defined by your entry price minus your stop-loss price, multiplied by the number of shares) should not exceed $1,000.</li>
</ul>
<p>This strategy is a game-changer because it ensures that you can be wrong many times in a row—even 10 or 20 times—and still have plenty of capital left to trade. It mathematically prevents you from blowing up your account.</p>`
      },
      {
        id: 'rm-3',
        type: 'content',
        title: 'Diversification: The Only Free Lunch?',
        content: `<h4>Don't Put All Your Eggs in One Basket</h4>
<p>Diversification is the practice of spreading your investments across various financial assets, industries, and geographical regions. It is often called "the only free lunch in finance" because it is one of the most effective ways to reduce risk without necessarily sacrificing returns.</p>
<p>The goal is to hold a portfolio of different assets that would each react differently to the same economic event. For instance, if you only hold airline stocks, a sudden spike in oil prices would hurt your entire portfolio. But if you also hold oil stocks, the gains in that sector could offset the losses in airlines.</p>
<p>A diversified portfolio might include:</p>
<ul>
    <li>Stocks from different industries (e.g., tech, healthcare, consumer goods).</li>
    <li>Different asset classes (e.g., stocks, bonds, real estate, cryptocurrencies).</li>
    <li>Assets from different countries to protect against regional economic downturns.</li>
</ul>
<p>In BullRun, you can practice diversification by building a portfolio of different stocks and cryptocurrencies, observing how they perform in relation to one another.</p>`
      },
      {
        id: 'rm-quiz-1',
        type: 'quiz',
        title: 'Risk Management Quiz',
      }
    ]
  },
  {
    id: 'fundamental-analysis',
    title: 'Fundamental Analysis',
    description: "Go beyond the chart and evaluate an asset's intrinsic value.",
    orderIndex: 5,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-fundamental')?.imageUrl || '',
    curriculum: [
      {
        id: 'fa-1',
        type: 'content',
        title: 'What is Fundamental Analysis?',
        content: `<h4>Valuing a Business, Not Just a Stock</h4>
<p>While technical analysis focuses on chart patterns and market statistics, fundamental analysis involves digging into the underlying factors that can affect an asset's value. For stocks, this means evaluating the company's financial health, management, competitive advantages, and the industry it operates in. For cryptocurrencies, it involves assessing the project's technology, use case, tokenomics, and development team.</p>
<p>The core idea is to determine a company's "intrinsic value"—what it's really worth—and then compare that to its current market price. If the market price is below the intrinsic value, the stock is considered undervalued and could be a good buy. If it's above, it's overvalued and might be a candidate to sell.</p>`
      },
      {
        id: 'fa-2',
        type: 'content',
        title: 'Key Metrics for Stocks',
        content: `<h4>Reading the Financial Story</h4>
<p>Investors use several key ratios derived from a company's financial statements to quickly gauge its performance and valuation.</p>
<ul>
  <li><b>Earnings Per Share (EPS):</b> This is the company's profit divided by its total number of outstanding shares. A higher EPS generally indicates higher profitability. What's often more important is the growth of EPS over time.</li>
  <li><b>Price-to-Earnings (P/E) Ratio:</b> Calculated as the stock's price per share divided by its EPS. It tells you how much investors are willing to pay for each dollar of the company's earnings. A high P/E can mean a stock is overvalued, or that investors expect high future growth.</li>
  <li><b>Debt-to-Equity Ratio:</b> This measures a company's financial leverage by dividing its total liabilities by its shareholder equity. A high ratio indicates that a company has been aggressive in financing its growth with debt, which can be risky.</li>
</ul>`
      },
      {
        id: 'fa-3',
        type: 'content',
        title: 'Qualitative Factors',
        content: `<h4>Beyond the Numbers</h4>
<p>Not everything can be captured in a financial statement. Qualitative analysis involves looking at the intangible aspects of a business that can have a huge impact on its success.</p>
<ul>
  <li><b>Business Model:</b> How does the company make money? Is its revenue model sustainable?</li>
  <li><b>Competitive Advantage:</b> What gives the company a "moat" against competitors? This could be a strong brand (like Apple), network effects (like Meta), or proprietary technology.</li>
  <li><b>Management Team:</b> Is the leadership team experienced, competent, and trustworthy? Do they have a clear vision for the future?</li>
  <li><b>Industry Trends:</b> Is the company in a growing or shrinking industry? Technological or social changes can create massive tailwinds or headwinds for a business.</li>
</ul>
<p>Strong fundamental analysis combines both quantitative (the numbers) and qualitative (the story) factors to build a complete picture of an investment.</p>`
      },
      {
        id: 'fa-quiz-1',
        type: 'quiz',
        title: 'Fundamental Analysis Quiz',
      }
    ]
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Trading Strategies',
    description: 'Explore strategies beyond simple buying and holding.',
    orderIndex: 6,
    thumbnail: PlaceHolderImages.find(i => i.id === 'learning-advanced')?.imageUrl || '',
    curriculum: [
      {
        id: 'as-1',
        type: 'content',
        title: 'Swing Trading vs. Day Trading',
        content: `<h4>Choosing Your Time Horizon</h4>
<p>Not all trading is the same. The strategy you use often depends on your time commitment and risk tolerance.</p>
<p><b>Day Trading:</b></p>
<ul>
  <li>Day traders open and close all their positions within the same day, never holding trades overnight.</li>
  <li>This strategy requires significant time, focus, and a deep understanding of intraday chart patterns and order flow.</li>
  <li>The goal is to capture small price movements with large position sizes. It is extremely high-risk and generally not recommended for beginners.</li>
</ul>
<p><b>Swing Trading:</b></p>
<ul>
  <li>Swing traders hold positions for several days or weeks to profit from an anticipated "swing" or price movement.</li>
  <li>This approach is less time-intensive than day trading and relies on identifying trends and patterns on daily or weekly charts.</li>
  <li>It's often considered a good starting point for traders looking for a more active approach than long-term investing.</li>
</ul>`
      },
      {
        id: 'as-2',
        type: 'content',
        title: 'Introduction to Short Selling',
        content: `<h4>Profiting from a Decline</h4>
<p>Normally, investors buy a stock hoping its price will go up ("going long"). Short selling is the opposite: it's a bet that a stock's price will go down.</p>
<p>The process works like this:</p>
<ol>
  <li>An investor borrows shares of a stock from a broker.</li>
  <li>They immediately sell these borrowed shares on the open market.</li>
  <li>They wait for the stock's price to fall.</li>
  <li>If it does, they buy back the same number of shares at the new, lower price.</li>
  <li>Finally, they return the shares to the broker, and their profit is the difference between the price they sold at and the price they bought back at.</li>
</ol>
<p>Short selling is extremely risky. If the stock price goes up instead of down, the potential loss is theoretically infinite, because there's no limit to how high a stock price can rise.</p>`
      },
      {
        id: 'as-3',
        type: 'content',
        title: 'Basics of Options Trading',
        content: `<h4>The Power of Leverage and Flexibility</h4>
<p>Options are contracts that give the holder the <strong>right</strong>, but not the <strong>obligation</strong>, to buy or sell an underlying asset at a specified price (the "strike price") on or before a certain date (the "expiration date").</p>
<ul>
  <li><b>Call Option:</b> A contract that gives you the right to <em>buy</em> an asset at the strike price. You would buy a call option if you are bullish and believe the asset's price will rise significantly above the strike price before expiration.</li>
  <li><b>Put Option:</b> A contract that gives you the right to <em>sell</em> an asset at the strike price. You would buy a put option if you are bearish and believe the asset's price will fall significantly below the strike price.</li>
</ul>
<p>Options provide leverage, meaning you can control a large amount of stock for a relatively small cost (the "premium" you pay for the option). However, this leverage magnifies both gains and losses. Options trading is complex and involves strategies and risks far beyond simple stock trading.</p>`
      },
      {
        id: 'as-quiz-1',
        type: 'quiz',
        title: 'Advanced Strategies Quiz',
      }
    ]
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'intro-quiz-1',
    moduleId: 'intro-trading',
    type: 'quiz',
    title: 'Introductory Concepts Quiz',
    questions: [
      {
        id: 'q1',
        question: 'Which order type guarantees execution but not the price?',
        options: ['Limit Order', 'Market Order', 'Stop-Loss Order', 'Buy Stop Order'],
        correctIndex: 1,
        explanation: 'A market order executes immediately at the best available price, prioritizing speed over a specific price point.'
      },
      {
        id: 'q2',
        question: 'What is Market Capitalization (Market Cap)?',
        options: ['The total profit a company makes in a year', 'The price of a single share of stock', 'The total value of all a company\'s outstanding shares', 'The amount of cash a company has'],
        correctIndex: 2,
        explanation: 'Market Cap is a measure of a company\'s size, calculated by multiplying the share price by the number of shares.'
      },
      {
        id: 'q3',
        question: 'High volatility in an asset implies:',
        options: ['The price is very stable', 'The asset is easy to buy and sell', 'The price can change dramatically in a short period', 'The asset is always profitable'],
        correctIndex: 2,
        explanation: 'Volatility is a measure of an asset\'s price swings. High volatility means large and rapid price movements, indicating higher risk and potential reward.'
      },
      {
        id: 'q4',
        question: 'What is a key difference between owning a stock and owning a cryptocurrency?',
        options: ['Stocks are riskier than cryptocurrencies', 'Stock markets are open 24/7, unlike crypto markets', 'Stocks represent a share of ownership in a company, while cryptocurrencies generally do not', 'You can only buy cryptocurrencies with cash'],
        correctIndex: 2,
        explanation: 'A stock certificate represents a legal claim on a company\'s assets and earnings, which is a fundamental difference from cryptocurrencies.'
      },
      {
        id: 'q5',
        question: 'If you want to buy a stock at a specific price or lower, which order should you use?',
        options: ['Market Order', 'Limit Order', 'Stop-Loss Order', 'Sell Order'],
        correctIndex: 1,
        explanation: 'A limit order allows you to set the maximum price you are willing to pay for a stock, giving you control over the execution price.'
      }
    ]
  },
  {
    id: 'ta-quiz-1',
    moduleId: 'tech-analysis',
    type: 'quiz',
    title: 'Technical Analysis Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is a "support" level in technical analysis?',
        options: ['A price ceiling that is hard for a stock to break above', 'A historical price level that indicates strong selling pressure', 'The average price of a stock over 50 days', 'A price floor where buying pressure tends to stop a price decline'],
        correctIndex: 3,
        explanation: 'Support is like a floor where demand is strong enough to prevent the price from falling further.'
      },
      {
        id: 'q2',
        question: 'The core assumption of technical analysis is that:',
        options: ['A company\'s financial statements are the most important factor', 'All available information is already reflected in the stock\'s price', 'Past prices have no bearing on future prices', 'Markets are completely random and unpredictable'],
        correctIndex: 1,
        explanation: 'Technical analysts believe that all public and private information is priced into an asset, so they focus on analyzing the price chart itself.'
      },
      {
        id: 'q3',
        question: 'A "Golden Cross" is considered a bullish signal. What does it signify?',
        options: ['A long-term moving average crosses below a short-term moving average', 'The trading volume suddenly increases by 50%', 'A short-term moving average crosses above a long-term moving average', 'The stock price hits a new all-time high'],
        correctIndex: 2,
        explanation: 'A Golden Cross, such as the 50-day MA crossing above the 200-day MA, suggests that momentum is shifting to the upside.'
      },
      {
        id: 'q4',
        question: 'What is a "resistance" level?',
        options: ['A price level where an uptrend tends to pause or reverse due to selling pressure', 'A level where the company is resistant to new ideas', 'A price level that supports a falling stock', 'The lowest price a stock has ever traded at'],
        correctIndex: 0,
        explanation: 'Resistance is like a price ceiling, where supply (sellers) is strong enough to stop the price from rising further.'
      },
      {
        id: 'q5',
        question: 'What is the main advantage of an Exponential Moving Average (EMA) over a Simple Moving Average (SMA)?',
        options: ['It is always more accurate', 'It gives more weight to recent prices, making it more responsive', 'It is easier to calculate', 'It only works for cryptocurrencies'],
        correctIndex: 1,
        explanation: 'The EMA reacts more quickly to recent price changes because it places a higher weighting on the most recent data points.'
      }
    ]
  },
  {
    id: 'cb-quiz-1',
    moduleId: 'crypto-basics',
    type: 'quiz',
    title: 'Crypto Concepts Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What does a cryptocurrency wallet actually store?',
        options: ['Your cryptocurrency coins', 'A record of all your transactions', 'Your private keys', 'A certificate of ownership from a bank'],
        correctIndex: 2,
        explanation: 'A wallet\'s primary function is to securely store the private keys that authorize you to spend your crypto assets on the blockchain.'
      },
      {
        id: 'q2',
        question: 'What is the main purpose of "gas" fees on the Ethereum network?',
        options: ['To pay for the electricity used by the network', 'A government tax on crypto transactions', 'To compensate miners/validators for processing transactions and executing smart contracts', 'A fee to convert Ethereum to dollars'],
        correctIndex: 2,
        explanation: '"Gas" is the fee required to successfully conduct a transaction or execute a contract on the Ethereum blockchain.'
      },
      {
        id: 'q3',
        question: 'What does it mean for a blockchain to be "immutable"?',
        options: ['It is silent and makes no sound', 'It can be easily changed by anyone', 'Once data is recorded, it cannot be altered or removed', 'It is controlled by a single company'],
        correctIndex: 2,
        explanation: 'Immutability is a key feature of blockchain, meaning that transactions are permanently recorded and cannot be changed, providing a high level of security and trust.'
      },
      {
        id: 'q4',
        question: 'Which of these best describes a "private key"?',
        options: ['A secret password that gives you access to spend your crypto', 'Your public username on the blockchain', 'A key to a physical safe where you keep your coins', 'A type of crypto wallet'],
        correctIndex: 0,
        explanation: 'The private key is the single most important piece of information; it provides access to your funds and must be kept secret at all costs.'
      },
      {
        id: 'q5',
        question: 'A primary use case for Ethereum that differs from Bitcoin is:',
        options: ['Acting as a store of value like digital gold', 'Enabling peer-to-peer payments', 'Providing a platform for building decentralized applications (dApps)', 'Having a limited supply of 21 million coins'],
        correctIndex: 2,
        explanation: 'Ethereum\'s key innovation was its programmable blockchain, allowing developers to create smart contracts and build complex dApps.'
      }
    ]
  },
  {
    id: 'rm-quiz-1',
    moduleId: 'risk-management',
    type: 'quiz',
    title: 'Risk Management Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is the main purpose of portfolio diversification?',
        options: ['To guarantee profits', 'To concentrate risk in one asset', 'To reduce overall portfolio risk by spreading investments across different assets', 'To make trading more complicated'],
        correctIndex: 2,
        explanation: 'Diversification is a core risk management strategy to minimize the impact of poor performance from a single asset.'
      },
      {
        id: 'q2',
        question: 'Using the 1% Rule, if your total trading capital is $50,000, what is the maximum amount you should risk on a single trade?',
        options: ['$100', '$5,000', '$50', '$500'],
        correctIndex: 3,
        explanation: 'The 1% rule limits the potential loss on a single trade to 1% of your total capital. 1% of $50,000 is $500.'
      },
      {
        id: 'q3',
        question: 'If you buy a stock at $100 and want to limit your potential loss to $10 per share, where should you place a stop-loss order?',
        options: ['At $110', 'At $90', 'At $100', 'You don\'t need a stop-loss'],
        correctIndex: 1,
        explanation: 'A stop-loss order is placed below the current price for a long position to sell the asset if it falls to that price, thereby limiting the loss.'
      },
      {
        id: 'q4',
        question: 'Which of these is NOT a principle of risk management?',
        options: ['Protecting your trading capital', 'Using appropriate position sizing', 'Going "all-in" on a trade you feel very confident about', 'Diversifying your investments'],
        correctIndex: 2,
        explanation: 'Going "all-in" is the opposite of risk management; it exposes your entire portfolio to the risk of a single trade.'
      },
      {
        id: 'q5',
        question: 'If your portfolio drops by 25%, what percentage gain do you need to get back to your starting point?',
        options: ['25%', '33.3%', '50%', '100%'],
        correctIndex: 1,
        explanation: 'If a $100 portfolio drops 25% to $75, you need to make $25 to get back to $100. A $25 gain on a $75 portfolio is a 33.3% return ($25 / $75).'
      }
    ]
  },
  {
    id: 'fa-quiz-1',
    moduleId: 'fundamental-analysis',
    type: 'quiz',
    title: 'Fundamental Analysis Quiz',
    questions: [
      {
        id: 'q1',
        question: 'Fundamental analysis is primarily concerned with:',
        options: ['Chart patterns and trading volume', 'The historical price of a stock', "A company's financial health and intrinsic value", 'Market sentiment and news headlines'],
        correctIndex: 2,
        explanation: "Fundamental analysis focuses on the underlying business, including its financial statements and competitive position, to determine its 'real' worth."
      },
      {
        id: 'q2',
        question: 'A high Price-to-Earnings (P/E) ratio might suggest that:',
        options: ['The stock is definitely undervalued', 'The company is not profitable', 'Investors expect high future growth from the company', 'The company has a lot of debt'],
        correctIndex: 2,
        explanation: 'A high P/E ratio means investors are willing to pay a premium for the company\'s earnings, often because they anticipate strong growth in the future.'
      },
      {
        id: 'q3',
        question: 'Which of the following is considered a "qualitative" factor in fundamental analysis?',
        options: ['Earnings Per Share (EPS)', 'Revenue growth percentage', 'The strength of the company\'s management team', 'The company\'s Debt-to-Equity ratio'],
        correctIndex: 2,
        explanation: 'Qualitative factors are non-numeric and relate to the quality of the business, such as its management, brand reputation, and competitive advantages.'
      },
      {
        id: 'q4',
        question: 'What does the Earnings Per Share (EPS) metric tell you?',
        options: ["How much debt a company has", "The company's total profit allocated to each outstanding share of stock", "The stock's current market price", "How many employees the company has"],
        correctIndex: 1,
        explanation: 'EPS is a measure of profitability, showing how much money the company makes for each share of its stock.'
      },
      {
        id: 'q5',
        question: 'If a stock\'s market price is significantly lower than its calculated "intrinsic value", a fundamental analyst would consider the stock to be:',
        options: ['Overvalued', 'Fairly valued', 'Undervalued', 'Worthless'],
        correctIndex: 2,
        explanation: 'The goal of fundamental analysis is to find stocks trading for less than their true worth. This situation represents a potential buying opportunity.'
      }
    ]
  },
  {
    id: 'as-quiz-1',
    moduleId: 'advanced-strategies',
    type: 'quiz',
    title: 'Advanced Strategies Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is the primary goal of a swing trader?',
        options: ['To buy and sell dozens of times in one day', 'To hold positions for several days or weeks to capture a price "swing"', 'To invest in a company for many years', 'To only trade during the first hour of the market open'],
        correctIndex: 1,
        explanation: 'Swing trading operates on a multi-day or multi-week time horizon, aiming to profit from medium-term trends or patterns.'
      },
      {
        id: 'q2',
        question: 'Short selling a stock is a bet that its price will:',
        options: ['Go up', 'Stay the same', 'Go down', 'Become more volatile'],
        correctIndex: 2,
        explanation: 'Short sellers profit when the price of the asset they have borrowed and sold decreases, allowing them to buy it back cheaper.'
      },
      {
        id: 'q3',
        question: 'What is the biggest risk associated with short selling?',
        options: ['The stock price could go to zero', 'The potential loss is theoretically infinite', 'You might have to pay dividends', 'The trade executes too slowly'],
        correctIndex: 1,
        explanation: 'Since there is no upper limit to how high a stock price can rise, a short seller\'s losses can exceed their initial investment many times over.'
      },
      {
        id: 'q4',
        question: 'If you are very bullish on a stock and believe its price will rise significantly, which type of option would you buy?',
        options: ['A Call Option', 'A Put Option', 'A Stop-Loss Option', 'A Market Option'],
        correctIndex: 0,
        explanation: 'A call option gives you the right to BUY the stock at a set price, so it becomes profitable if the stock price rises above that strike price.'
      },
      {
        id: 'q5',
        question: 'What does an options contract give the holder?',
        options: ['The obligation to buy or sell an asset', 'A share of ownership in the company', 'The right, but not the obligation, to buy or sell an asset at a set price', 'A guaranteed profit'],
        correctIndex: 2,
        explanation: 'The key feature of an option is the "right" without the "obligation," giving the trader flexibility and defined risk (the premium paid).'
      }
    ]
  }
];

export const mockBadges: Omit<Badge, 'icon'>[] = [
  {
    id: 'first_trade',
    title: 'First Trade',
    description: 'Awarded for making your first trade.',
    iconName: 'PocketKnife',
    criteria: { type: 'first_trade' },
  },
  {
    id: 'profit_target',
    title: 'Profit Achiever',
    description: 'Awarded for reaching a profit of over $20,000.',
    iconName: 'TrendingUp',
    criteria: { type: 'profit_target' },
  },
  {
    id: 'learning_master',
    title: 'Learning Master',
    description: 'Awarded for completing all learning modules.',
    iconName: 'BookCheck',
    criteria: { type: 'complete_all_modules' },
  },
  {
    id: 'streak_badge',
    title: 'Streak',
    description: 'Awarded for logging in 5 days in a row.',
    iconName: 'Award',
    criteria: { type: 'streak' },
  },
  {
    id: 'diversifier',
    title: 'Diversifier',
    description: 'Hold at least 5 different assets in your portfolio.',
    iconName: 'Library',
    criteria: { type: 'hold_assets', count: 5 },
  },
  {
    id: 'active_trader',
    title: 'Active Trader',
    description: 'Execute 10 trades.',
    iconName: 'Repeat',
    criteria: { type: 'trade_count', count: 10 },
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Execute a single trade with a value over $10,000.',
    iconName: 'Gem',
    criteria: { type: 'trade_value', value: 10000 },
  },
  {
    id: 'crypto_pioneer',
    title: 'Crypto Pioneer',
    description: 'Make your first cryptocurrency trade.',
    iconName: 'Bitcoin',
    criteria: { type: 'first_trade_type', assetType: 'crypto' },
  },
  {
    id: 'stock_specialist',
    title: 'Stock Specialist',
    description: 'Make your first stock trade.',
    iconName: 'Landmark',
    criteria: { type: 'first_trade_type', assetType: 'stock' },
  },
  {
    id: 'quiz_whiz',
    title: 'Quiz Whiz',
    description: 'Successfully complete your first quiz.',
    iconName: 'BrainCircuit',
    criteria: { type: 'first_quiz' },
  },
];

export const baseAssets: Omit<Asset, 'price' | 'change' | 'changePercent'>[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', marketCap: 2800000000000, type: 'stock', initialPrice: 172.25 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', marketCap: 1750000000000, type: 'stock', initialPrice: 139.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', marketCap: 2450000000000, type: 'stock', initialPrice: 330.10 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', marketCap: 800000000000, type: 'stock', initialPrice: 250.70 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', marketCap: 1340000000000, type: 'stock', initialPrice: 130.45 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', marketCap: 1120000000000, type: 'stock', initialPrice: 450.25 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', marketCap: 805000000000, type: 'stock', initialPrice: 315.60 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', marketCap: 430000000000, type: 'stock', initialPrice: 145.80 },
  { symbol: 'V', name: 'Visa Inc.', marketCap: 480000000000, type: 'stock', initialPrice: 240.15 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', marketCap: 430000000000, type: 'stock', initialPrice: 165.40 },
  { symbol: 'WMT', name: 'Walmart Inc.', marketCap: 420000000000, type: 'stock', initialPrice: 155.90 },
  { symbol: 'PG', name: 'Procter & Gamble Co.', marketCap: 360000000000, type: 'stock', initialPrice: 150.20 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', marketCap: 485000000000, type: 'stock', initialPrice: 520.50 },
  { symbol: 'HD', name: 'The Home Depot, Inc.', marketCap: 335000000000, type: 'stock', initialPrice: 330.70 },
  { symbol: 'MA', name: 'Mastercard Inc.', marketCap: 370000000000, type: 'stock', initialPrice: 390.80 },
  { symbol: 'BTC', name: 'Bitcoin', marketCap: 830000000000, type: 'crypto', initialPrice: 42500.00 },
  { symbol: 'ETH', name: 'Ethereum', marketCap: 276000000000, type: 'crypto', initialPrice: 2300.00 },
  { symbol: 'SOL', name: 'Solana', marketCap: 30000000000, type: 'crypto', initialPrice: 75.50 },
  { symbol: 'XRP', name: 'XRP', marketCap: 32000000000, type: 'crypto', initialPrice: 0.62 },
  { symbol: 'ADA', name: 'Cardano', marketCap: 14000000000, type: 'crypto', initialPrice: 0.40 },
];
