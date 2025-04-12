import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById } from '@/backend/services/game/scenarios';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler for retrieving a specific scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const scenario = await getScenarioById(id);
    
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(scenario, { status: 200 });
  } catch (error) {
    console.error(`Error in scenario/${params.id} API:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
} 