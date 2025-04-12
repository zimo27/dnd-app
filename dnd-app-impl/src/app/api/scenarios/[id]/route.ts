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
    console.log(`API route: Fetching scenario with ID: ${id}`);
    
    const scenario = await getScenarioById(id);
    
    if (!scenario) {
      console.log(`API route: Scenario not found for ID: ${id}`);
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    console.log(`API route: Successfully retrieved scenario for ID: ${id}`);
    return NextResponse.json(scenario, { status: 200 });
  } catch (error) {
    console.error(`Error in scenario/${params.id} API:`, error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch scenario',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 