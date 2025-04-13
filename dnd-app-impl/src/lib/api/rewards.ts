import { GameState } from '@/shared/types/game';

export interface AttributeReward {
  attribute: string;
  amount: number;
}

/**
 * Apply an attribute reward to the player
 */
export async function applyAttributeReward(
  gameState: GameState,
  attributeReward: AttributeReward
): Promise<{ gameState: GameState; rewardMessage: string }> {
  try {
    const response = await fetch('/api/reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, attributeReward }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to apply reward');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error applying attribute reward:', error);
    throw error;
  }
}

/**
 * Check for rewards after a skill check or other interaction
 */
export async function checkRewardsForSkill(
  gameState: GameState,
  userMessage: string,
  aiResponse: string
): Promise<{ attributeReward?: { attribute: string; amount: number; reason: string; achievement?: boolean; achievementTitle?: string } }> {
  try {
    const response = await fetch('/api/check-rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, userMessage, aiResponse }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check for rewards');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking for rewards:', error);
    return {}; // Return empty object if there's an error
  }
} 