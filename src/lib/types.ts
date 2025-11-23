
export type User = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string;
  walletSimulated: number;
  walletReal: number;
  badgeIds: string[];
  watchlist: string[];
  modulesCompleted: string[];
  quizzesCompleted: string[];
  createdAt: string;
  theme: 'light' | 'dark';
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
  timestamp: any;
};

export type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  type: 'quiz';
  moduleId: string;
  questions: Question[];
};

export type SubModule = {
  id: string;
  title: string;
  content: string;
  type: 'content';
};

export type ModuleItem = SubModule | { id: string; type: 'quiz', title: string };

export type Module = {
  id:string;
  title: string;
  description: string;
  orderIndex: number;
  thumbnail: string;
  curriculum: (SubModule | { id: string; type: 'quiz', title: string })[];
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  iconName: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  criteria: any;
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
