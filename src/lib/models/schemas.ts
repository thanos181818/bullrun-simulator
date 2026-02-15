import mongoose, { Schema, Model, Document } from 'mongoose';
import type { User, Asset, Trade, Portfolio, Holding, Badge, Watchlist } from '../types';

// User Schema
export interface UserDocument extends Omit<User, 'id'>, Document {
  _id: string;
}

const UserSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  avatar: String,
  cashBalance: { type: Number, default: 10000 },
  portfolioValue: { type: Number, default: 0 },
  maxPortfolioValue: { type: Number, default: 0 },
  totalReturn: { type: Number, default: 0 },
  totalReturnPercent: { type: Number, default: 0 },
  cashEarned: { type: Number, default: 0 },
  badgeIds: [String],
  balanceHistory: [{
    type: {
      type: String,
      enum: ['initial', 'trade', 'achievement', 'daily-bonus', 'manual-add'],
      required: true
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    reference: String, // e.g., trade ID, badge ID, etc
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  watchlist: [String],
  themePreference: { type: String, default: 'system' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginDate: Date,
  lastDailyBonusDate: Date,
}, { timestamps: true });

export const UserModel: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

// Asset Schema
export interface AssetDocument extends Omit<Asset, 'id'>, Document {
  _id: string;
}

const AssetSchema = new Schema<AssetDocument>({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  marketCap: { type: Number, required: true },
  type: { type: String, enum: ['stock', 'crypto'], required: true },
  initialPrice: { type: Number, required: true },
}, { timestamps: true });

export const AssetModel: Model<AssetDocument> = mongoose.models.Asset || mongoose.model<AssetDocument>('Asset', AssetSchema);

// Trade Schema
export interface TradeDocument extends Omit<Trade, 'id'>, Document {
  _id: string;
}

const TradeSchema = new Schema<TradeDocument>({
  userId: { type: String, required: true, index: true },
  mode: { type: String, enum: ['simulated', 'real'], required: true },
  assetSymbol: { type: String, required: true },
  assetType: { type: String, enum: ['stock', 'crypto'], required: true },
  quantity: { type: Number, required: true },
  orderType: { type: String, enum: ['buy', 'sell'], required: true },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

TradeSchema.index({ userId: 1, timestamp: -1 });

export const TradeModel: Model<TradeDocument> = mongoose.models.Trade || mongoose.model<TradeDocument>('Trade', TradeSchema);

// Portfolio Schema
export interface PortfolioDocument extends Omit<Portfolio, 'id'>, Document {
  _id: string;
}

const HoldingSchema = new Schema<Holding>({
  assetSymbol: { type: String, required: true },
  quantity: { type: Number, required: true },
  avgBuyPrice: { type: Number, required: true },
}, { _id: false });

const PortfolioSchema = new Schema<PortfolioDocument>({
  userId: { type: String, required: true },
  mode: { type: String, enum: ['simulated', 'real'], required: true },
  holdings: [HoldingSchema],
}, { timestamps: true });

// Compound index to ensure one portfolio per user per mode
PortfolioSchema.index({ userId: 1, mode: 1 }, { unique: true });

export const PortfolioModel: Model<PortfolioDocument> = mongoose.models.Portfolio || mongoose.model<PortfolioDocument>('Portfolio', PortfolioSchema);

// Badge Schema
export interface BadgeDocument extends Omit<Badge, 'id'>, Document {
  _id: string;
}

const BadgeSchema = new Schema<BadgeDocument>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  unlockedIcon: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], required: true },
}, { timestamps: true });

export const BadgeModel: Model<BadgeDocument> = mongoose.models.Badge || mongoose.model<BadgeDocument>('Badge', BadgeSchema);

// Watchlist Schema (if you want separate collection)
export interface WatchlistDocument extends Omit<Watchlist, 'id'>, Document {
  _id: string;
}

const WatchlistSchema = new Schema<WatchlistDocument>({
  userId: { type: String, required: true, unique: true },
  assetSymbols: [String],
}, { timestamps: true });

export const WatchlistModel: Model<WatchlistDocument> = mongoose.models.Watchlist || mongoose.model<WatchlistDocument>('Watchlist', WatchlistSchema);

// PriceHistory Schema
export interface PriceHistoryDocument extends Document {
  _id: string;
  symbol: string;
  timestamp: number;
  price: number;
}

const PriceHistorySchema = new Schema<PriceHistoryDocument>({
  symbol: { type: String, required: true, index: true },
  timestamp: { type: Number, required: true },
  price: { type: Number, required: true },
}, { timestamps: false });

// Compound index for efficient range queries
PriceHistorySchema.index({ symbol: 1, timestamp: 1 });

export const PriceHistoryModel: Model<PriceHistoryDocument> = mongoose.models.PriceHistory || mongoose.model<PriceHistoryDocument>('PriceHistory', PriceHistorySchema);