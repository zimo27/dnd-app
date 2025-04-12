import { NextRequest, NextResponse } from 'next/server';
import { GameState, SkillCheckResult } from '@/shared/types/game';
import { getScenarioById } from '@/backend/services/game/scenarios';

/**
 * POST handler for performing skill checks
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, skillName } = await request.json();
    
    if (!gameState || !skillName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the full scenario data for skill information
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario || !scenario.baseSkills || !scenario.baseSkills[skillName]) {
      return NextResponse.json(
        { error: 'Invalid skill or scenario' },
        { status: 400 }
      );
    }
    
    const skill = scenario.baseSkills[skillName];
    const attributeValue = gameState.character_data.attributes[skill.attribute] || 0;
    
    // Basic dice roll (d20)
    const roll = Math.floor(Math.random() * 20) + 1;
    const totalRoll = roll + attributeValue;
    
    // Basic difficulty calculation (can be improved)
    const difficulty = 10; // Default medium difficulty
    const success = totalRoll >= difficulty;
    
    const result: SkillCheckResult = {
      success,
      roll,
      difficulty,
      attribute: skill.attribute,
      attributeValue,
      skillName,
      narrativeResult: success 
        ? `You successfully used ${skillName}!` 
        : `Your attempt at ${skillName} failed.`
    };
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in skill check API:', error);
    return NextResponse.json(
      { error: 'Failed to perform skill check' },
      { status: 500 }
    );
  }
} 