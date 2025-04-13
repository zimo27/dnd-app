import { NextRequest, NextResponse } from 'next/server';
import { checkForRewards } from '@/backend/services/ai/openai';
import { GameState } from '@/shared/types/game';

// Keep track of when skills were rewarded to prevent too frequent rewards
const skillRewardTracker: Record<string, { lastRewardedTime: number, consecutiveRewards: number }> = {};

// Helper function to determine if a skill should be eligible for reward
function shouldCheckForSkillReward(gameState: GameState, userMessage: string): boolean {
  const characterId = gameState.id;
  const now = Date.now();
  
  // Initialize tracker if needed
  if (!skillRewardTracker[characterId]) {
    skillRewardTracker[characterId] = { 
      lastRewardedTime: 0,
      consecutiveRewards: 0
    };
  }
  
  const tracker = skillRewardTracker[characterId];
  
  // Count skill-based messages in recent history (last 6 messages)
  const recentHistory = gameState.history.slice(-6);
  const recentSkillUses = recentHistory.filter(msg => 
    msg.sender === 'user' && msg.message.toLowerCase().includes('skill')
  ).length;
  
  // Calculate time since last reward
  const timeSinceLastReward = now - tracker.lastRewardedTime;
  
  // Add randomness - base chance is 25% for skills
  const randomChance = Math.random();
  const baseChance = 0.25;
  
  // Increase chance if it's been a while since last reward (at least 3 minutes)
  const timeBonus = timeSinceLastReward > 3 * 60 * 1000 ? 0.25 : 0;
  
  // Decrease chance if there have been consecutive rewards
  const consecutivePenalty = tracker.consecutiveRewards * 0.2;
  
  // Final chance calculation
  const finalChance = Math.min(0.9, Math.max(0.1, baseChance + timeBonus - consecutivePenalty));
  
  console.log('Skill reward chance calculation:', {
    characterId,
    baseChance,
    timeBonus,
    consecutivePenalty,
    finalChance,
    randomRoll: randomChance,
    timeSinceLastReward: Math.floor(timeSinceLastReward / 1000) + 's',
    recentSkillUses,
    consecutiveRewards: tracker.consecutiveRewards
  });
  
  return randomChance <= finalChance;
}

/**
 * POST handler for checking if the player deserves rewards after an interaction
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, userMessage, aiResponse } = await request.json();
    
    if (!gameState || !userMessage || !aiResponse) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Add a check for skill messages - they should have a lower chance of rewards
    const isSkillMessage = userMessage.toLowerCase().includes('skill');
    
    // For skill messages, add randomness to rewards to make them less frequent
    if (isSkillMessage && !shouldCheckForSkillReward(gameState, userMessage)) {
      console.log('Skill reward check skipped due to frequency limiting');
      return NextResponse.json({}, { status: 200 });
    }
    
    // Check if player deserves a reward
    const rewardResult = await checkForRewards(gameState as GameState, userMessage, aiResponse);
    
    // If a reward was given, update the tracker
    if (rewardResult.attributeReward) {
      const characterId = gameState.id;
      if (!skillRewardTracker[characterId]) {
        skillRewardTracker[characterId] = { 
          lastRewardedTime: 0,
          consecutiveRewards: 0
        };
      }
      
      skillRewardTracker[characterId].lastRewardedTime = Date.now();
      skillRewardTracker[characterId].consecutiveRewards += 1;
      
      console.log('Skill reward tracker updated:', skillRewardTracker[characterId]);
    } else {
      // If no reward this time, reset the consecutive counter (but keep the timestamp)
      const characterId = gameState.id;
      if (skillRewardTracker[characterId]) {
        skillRewardTracker[characterId].consecutiveRewards = 0;
      }
    }
    
    console.log('Skill reward check result:', 
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
    
    // Return the reward result (may be empty if no reward)
    return NextResponse.json(rewardResult, { status: 200 });
  } catch (error) {
    console.error('Error in check-rewards API:', error);
    return NextResponse.json(
      { error: 'Failed to check for rewards' },
      { status: 500 }
    );
  }
} 