import { GameState, SkillCheckResult } from '@/shared/types/game';

/**
 * Perform a skill check against the API
 */
export async function performSkillCheck(
  gameState: GameState,
  skillName: string
): Promise<SkillCheckResult> {
  try {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, skillName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to perform skill check');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error performing skill check:', error);
    throw error;
  }
}

/**
 * Get narrative continuation based on a skill check 
 */
export async function getNarrativeForSkill(
  gameState: GameState,
  result: SkillCheckResult
): Promise<string> {
  try {
    const response = await fetch('/api/narrative-skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, result }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get narrative for skill check');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error getting narrative for skill:', error);
    throw error;
  }
} 