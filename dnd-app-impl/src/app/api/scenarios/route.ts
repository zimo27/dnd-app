import { NextRequest, NextResponse } from 'next/server';
import { getScenarios } from '@/backend/services/game/scenarios';

/**
 * GET handler for retrieving all scenarios
 */
export async function GET(request: NextRequest) {
  try {
    const scenarios = await getScenarios();
    return NextResponse.json(scenarios, { status: 200 });
  } catch (error) {
    console.error('Error in scenarios API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
} 