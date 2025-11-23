
import { getAIInsightsAction } from '@/lib/actions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await getAIInsightsAction();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error for AI insights:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
