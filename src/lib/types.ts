
export type User = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
  cashBalance: number;
  portfolioValue: number;
  maxPortfolioValue?: number; // tracks highest portfolio value for comeback kid badge
  totalReturn: number;
  totalReturnPercent: number;
  badgeIds: string[];
  watchlist: string[];
  themePreference: 'light' | 'dark' | 'system';
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Holding = {
  assetSymbol: string;
  quantity: number;
  avgBuyPrice: number;
};

export type Portfolio = {
  userId: string;
  mode: 'simulated' | 'real';
  holdings: Holding[];
};

export type Trade = {
  id?: string;
  userId: string;
  mode: 'simulated' | 'real';
  assetSymbol: string;
  assetType: 'stock' | 'crypto';
  quantity: number;
  orderType: 'buy' | 'sell';
  price: number;
  totalAmount: number;
  timestamp: Date;
};

export type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedIcon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
};

export type Asset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  type: 'stock' | 'crypto';
  initialPrice: number;
};

export type LeaderboardEntry = {
  rank: number;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  portfolioValue: number;
  percentGain: number;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
};

export type PriceData = {
  time: number;
  price: number;
};

export type Watchlist = {
  userId: string;
  assetSymbols: string[];
}

export type Transaction = Trade;
