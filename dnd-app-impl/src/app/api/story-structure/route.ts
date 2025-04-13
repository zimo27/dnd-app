import { NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/shared/types/game';
import { generateStoryStructure } from '@/backend/services/ai/openai';

/**
 * POST handler for generating story structure
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📜 STORY STRUCTURE API CALLED');
    
    const { gameState } = await request.json();
    
    if (!gameState) {
      console.error('❌ STORY STRUCTURE API ERROR: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const storyStructure = await generateStoryStructure(gameState as GameState);
    
    console.log('✅ STORY STRUCTURE API - Response prepared:', storyStructure);
    
    return NextResponse.json({
      storyStructure
    }, { status: 200 });
  } catch (error) {
    console.error('❌ STORY STRUCTURE API ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to generate story structure' },
      { status: 500 }
    );
  }
} 