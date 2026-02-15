import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { BadgeModel } from '@/lib/models/schemas';

export async function GET() {
  try {
    await connectToDatabase();
    
    const badges = await BadgeModel.find({});
    
    return NextResponse.json(
      badges.map(badge => ({
        id: badge.id || badge._id.toString(),
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        unlockedIcon: badge.unlockedIcon,
        rarity: badge.rarity,
      }))
    );
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
