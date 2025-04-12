import { GameState } from '@/shared/types/game';

/**
 * Generate a character image based on the player's selections and scenario
 */
export async function generateCharacterImage(
  gameState: GameState,
  scenarioTitle: string
): Promise<string> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, scenarioTitle }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate character image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating character image:', error);
    throw error;
  }
} 