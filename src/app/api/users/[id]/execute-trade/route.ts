import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { UserModel, PortfolioModel, TradeModel, AssetModel } from '@/lib/models/schemas';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ClientSession } from 'mongodb';
import mongoose from 'mongoose';

// POST /api/users/[id]/execute-trade - Execute a buy or sell trade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { assetSymbol, assetType, quantity, price, orderType, mode = 'simulated' } = body;
    
    if (!assetSymbol || !quantity || !price || !orderType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const totalAmount = quantity * price;
    
    // Use MongoDB transaction for atomicity
    const mongoSession: ClientSession = await mongoose.startSession();
    
    try {
      await mongoSession.withTransaction(async () => {
        // Get user document - handle both email and ObjectId
        const user = id.includes('@')
          ? await UserModel.findOne({ email: id }).session(mongoSession)
          : await UserModel.findById(id).session(mongoSession);
        if (!user) {
          throw new Error('User not found');
        }
        
        // Ensure cashBalance exists and is a valid number
        let currentBalance = typeof user.cashBalance === 'number' ? user.cashBalance : 0;
        
        // Check if user has enough balance for buy
        if (orderType === 'buy') {
          if (currentBalance <= 0) {
            throw new Error('Insufficient balance. Please add funds to your account.');
          }
          if (currentBalance < totalAmount) {
            throw new Error(`Insufficient funds. You have $${currentBalance.toFixed(2)} but need $${totalAmount.toFixed(2)}.`);
          }
          currentBalance -= totalAmount;
        }
        
        // Get or create portfolio
        let portfolio = await PortfolioModel.findOne({ 
          userId: user._id, 
          mode 
        }).session(mongoSession);
        
        if (!portfolio) {
          portfolio = new PortfolioModel({
            userId: user._id,
            mode,
            holdings: [],
          });
        }
        
        // Clone holdings array to avoid mutation issues
        let holdings = (portfolio.holdings || []).map(h => ({
          assetSymbol: h.assetSymbol,
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
        }));
        
        if (orderType === 'buy') {
          // Find existing holding
          const existingHoldingIndex = holdings.findIndex(
            h => h.assetSymbol === assetSymbol
          );
          
          if (existingHoldingIndex >= 0) {
            // Update existing holding
            const holding = holdings[existingHoldingIndex];
            const newQuantity = holding.quantity + quantity;
            const newAvgBuyPrice = 
              ((holding.avgBuyPrice * holding.quantity) + totalAmount) / newQuantity;
            
            holdings[existingHoldingIndex] = {
              assetSymbol: assetSymbol,
              quantity: newQuantity,
              avgBuyPrice: newAvgBuyPrice,
            };
          } else {
            // Add new holding
            holdings.push({
              assetSymbol: assetSymbol,
              quantity: quantity,
              avgBuyPrice: price,
            });
          }
        } else if (orderType === 'sell') {
          // Find holding to sell
          const holdingIndex = holdings.findIndex(h => h.assetSymbol === assetSymbol);
          
          if (holdingIndex === -1) {
            throw new Error('You do not own this asset to sell.');
          }
          
          const holding = holdings[holdingIndex];
          
          if (holding.quantity < quantity) {
            throw new Error('You cannot sell more than you own.');
          }
          
          // Update balance
          currentBalance += totalAmount;
          
          // Update or remove holding
          if (holding.quantity === quantity) {
            holdings.splice(holdingIndex, 1);
          } else {
            holdings[holdingIndex] = {
              assetSymbol: holding.assetSymbol,
              quantity: holding.quantity - quantity,
              avgBuyPrice: holding.avgBuyPrice,
            };
          }
        }
        
        // Update user balance with actual _id
        await UserModel.findByIdAndUpdate(
          user._id,
          { cashBalance: currentBalance },
          { session: mongoSession }
        );
        
        // Calculate updated portfolio value and total return
        // Fetch current prices for all holdings
        const uniqueSymbols = holdings.map(h => h.assetSymbol);
        const currentAssets = await AssetModel.find({
          symbol: { $in: uniqueSymbols }
        }).lean();
        
        const assetPriceMap = new Map(
          currentAssets.map(a => [a.symbol, a.price])
        );
        
        // Calculate portfolio value: cash + current value of all holdings
        let portfolioValue = currentBalance;
        let totalCost = 0;
        
        for (const holding of holdings) {
          const currentPrice = assetPriceMap.get(holding.assetSymbol) || holding.avgBuyPrice;
          const currentValue = holding.quantity * currentPrice;
          const cost = holding.quantity * holding.avgBuyPrice;
          
          portfolioValue += currentValue;
          totalCost += cost;
        }
        
        // Calculate total return
        const totalReturn = portfolioValue - totalCost - currentBalance;
        const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
        
        // Track max portfolio value for "Comeback Kid" badge
        const maxPortfolioValue = Math.max(user.maxPortfolioValue || 0, portfolioValue);
        
        // Create balance history entry for this trade
        const tradeDescription = `${orderType === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${assetSymbol} @ $${price}`;
        const transactionAmount = orderType === 'buy' ? -totalAmount : totalAmount;
        
        const balanceHistory = user.balanceHistory || [];
        balanceHistory.push({
          type: 'trade',
          amount: transactionAmount,
          description: tradeDescription,
          reference: assetSymbol,
          balanceAfter: currentBalance,
          createdAt: new Date(),
        });
        
        // Update user portfolio metrics with actual _id
        await UserModel.findByIdAndUpdate(
          user._id,
          { 
            cashBalance: currentBalance,
            portfolioValue,
            totalReturn,
            totalReturnPercent,
            maxPortfolioValue,
            totalReturnPercent,
            balanceHistory,
          },
          { session: mongoSession }
        );
        
        // Update portfolio
        portfolio.holdings = holdings;
        await portfolio.save({ session: mongoSession });
        
        // Create trade record
        await TradeModel.create(
          [{
            userId: user._id,
            mode,
            assetSymbol,
            assetType: assetType || 'stock',
            quantity,
            orderType,
            price,
            totalAmount,
            timestamp: new Date(),
          }],
          { session: mongoSession }
        );
      });
      
      await mongoSession.endSession();
      
      return NextResponse.json({ 
        success: true,
        message: `Successfully ${orderType === 'buy' ? 'purchased' : 'sold'} ${quantity} ${assetSymbol}`
      });
      
    } catch (error) {
      await mongoSession.endSession();
      throw error;
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute trade' },
      { status: 500 }
    );
  }
}
