import { NextRequest, NextResponse } from 'next/server';
import { GameState, SkillCheckResult } from '@/shared/types/game';
import { generateResponse } from '@/backend/services/ai/openai';

/**
 * POST handler for generating AI narratives based on skill checks
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, result } = await request.json();
    
    if (!gameState || !result) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Construct a prompt for the AI to continue the narrative based on the skill check
    const skillPrompt = `The player used the skill "${result.skillName}" and ${
      result.success ? 'succeeded' : 'failed'
    } with a roll of ${result.roll} + ${result.attributeValue} = ${
      result.roll + result.attributeValue
    } against a difficulty of ${result.difficulty}. 
    
    Continue the narrative based on this ${result.success ? 'success' : 'failure'}, making the outcome have a meaningful impact on the story. If successful, the player should gain an advantage or progress in their goal. If failed, there should be interesting consequences but the story should still progress.`;
    
    // Generate response
    const narrative = await generateResponse(gameState, skillPrompt);
    
    return NextResponse.json({ 
      response: narrative
    }, { status: 200 });
  } catch (error) {
    console.error('Error in narrative-skill API:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative response' },
      { status: 500 }
    );
  }
} 