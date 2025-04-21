import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, checkForRewards } from '@/backend/services/ai/openai';
import { GameState } from '@/shared/types/game';

/**
 * POST handler for generating AI responses in the chat
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, storyStructure, customPrompt } = await request.json();
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Extract the last user message from history
    const lastUserMessage = gameState.history[gameState.history.length - 1]?.message || '';
    
    // Generate the AI's narrative response
    const aiResponse = await generateResponse(
      gameState as GameState, 
      lastUserMessage,
      storyStructure,
      customPrompt
    );
    console.log('OpenAI narrative response generated:', { length: aiResponse.length });
    
    // Make a separate call to check for rewards
    const rewardResult = await checkForRewards(
      gameState as GameState, 
      lastUserMessage, 
      aiResponse
    );
    console.log('Reward check result:', 
      rewardResult.attributeReward 
        ? { 
            hasReward: true, 
            attribute: rewardResult.attributeReward.attribute,
            amount: rewardResult.attributeReward.amount,
            isAchievement: rewardResult.attributeReward.achievement || false,
            achievementTitle: rewardResult.attributeReward.achievementTitle || null
          }
        : { hasReward: false }
    );
    
    // If a reward was generated, return both the response and the reward
    if (rewardResult.attributeReward) {
      return NextResponse.json({
        response: {
          text: aiResponse,
          attributeReward: rewardResult.attributeReward
        }
      }, { status: 200 });
    }
    
    // Otherwise, just return the narrative response
    return NextResponse.json({ 
      response: aiResponse
    }, { status: 200 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 