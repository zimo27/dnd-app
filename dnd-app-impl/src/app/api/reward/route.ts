import { NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/shared/types/game';
import { getScenarioById } from '@/backend/services/game/scenarios';

/**
 * POST handler for rewarding player with attribute increases
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎁 REWARD API CALLED');
    
    const { gameState, attributeReward } = await request.json();
    
    console.log('🎁 REWARD API - Request Data:', { 
      gameStateId: gameState?.id,
      attributeReward
    });
    
    if (!gameState || !attributeReward) {
      console.error('❌ REWARD API ERROR: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the full scenario data to validate attribute names
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      console.error('❌ REWARD API ERROR: Invalid scenario', gameState.scenario_id);
      return NextResponse.json(
        { error: 'Invalid scenario' },
        { status: 400 }
      );
    }
    
    // Validate attribute name
    const { attribute, amount } = attributeReward;
    if (!scenario.attributes || !scenario.attributes[attribute]) {
      console.error('❌ REWARD API ERROR: Invalid attribute', attribute);
      return NextResponse.json(
        { error: 'Invalid attribute' },
        { status: 400 }
      );
    }
    
    // Validate amount (only small increases allowed)
    if (typeof amount !== 'number' || amount <= 0 || amount > 2) {
      console.error('❌ REWARD API ERROR: Invalid reward amount', amount);
      return NextResponse.json(
        { error: 'Invalid reward amount. Must be a positive number ≤ 2' },
        { status: 400 }
      );
    }
    
    // Apply the attribute increase
    const updatedGameState = JSON.parse(JSON.stringify(gameState)) as GameState;
    const currentValue = updatedGameState.character_data.attributes[attribute] || 0;
    updatedGameState.character_data.attributes[attribute] = currentValue + amount;
    
    console.log('✅ REWARD API - Attribute Updated:', { 
      attribute,
      before: currentValue,
      after: updatedGameState.character_data.attributes[attribute],
      difference: amount
    });
    
    // Update skills if the attribute increase affects skill availability
    if (scenario.baseSkills) {
      Object.entries(scenario.baseSkills).forEach(([skillName, skillInfo]) => {
        if (skillInfo.attribute === attribute) {
          // Make skill available if attribute is now at least 1
          if (updatedGameState.character_data.attributes[attribute] >= 1) {
            const skillWasAvailable = updatedGameState.character_data.skills[skillName];
            updatedGameState.character_data.skills[skillName] = true;
            
            if (!skillWasAvailable) {
              console.log('✅ REWARD API - New Skill Unlocked:', skillName);
            }
          }
        }
      });
    }
    
    // Create reward message
    const rewardMessage = {
      message: `You've grown stronger! Your ${attribute} increased by ${amount} point${amount !== 1 ? 's' : ''}.`,
      sender: 'system' as 'user' | 'system',
      timestamp: new Date().toISOString(),
      reward: {
        type: 'attribute' as 'attribute',
        attribute,
        amount
      }
    };
    
    // Add reward message to history
    updatedGameState.history.push(rewardMessage);
    updatedGameState.updated_at = new Date().toISOString();
    
    console.log('✅ REWARD API - Response prepared:', { 
      rewardMessage: rewardMessage.message,
      updatedAttribute: {
        name: attribute,
        value: updatedGameState.character_data.attributes[attribute]
      }
    });
    
    return NextResponse.json({
      gameState: updatedGameState,
      rewardMessage: rewardMessage.message
    }, { status: 200 });
  } catch (error) {
    console.error('❌ REWARD API ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to process reward' },
      { status: 500 }
    );
  }
} 