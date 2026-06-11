import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PortfolioSnapshotModel } from '@/lib/models/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const range = req.nextUrl.searchParams.get('range') || '1W';

  try {
    await connectToDatabase();

    let startDate = new Date();
    switch (range) {
      case '1D': startDate.setDate(startDate.getDate() - 1); break;
      case '1W': startDate.setDate(startDate.getDate() - 7); break;
      case '1M': startDate.setMonth(startDate.getMonth() - 1); break;
      case '3M': startDate.setMonth(startDate.getMonth() - 3); break;
      case '6M': startDate.setMonth(startDate.getMonth() - 6); break;
      case '1Y': startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }

    const snapshots = await PortfolioSnapshotModel.find({
      userId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .lean();

    const data = snapshots.map(s => ({
      time: s.timestamp.getTime(),
      value: s.totalValue
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Fetch portfolio history failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
