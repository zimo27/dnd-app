import { Scenario, GameState } from '@/shared/types/game';

/**
 * Fetch all available scenarios
 */
export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    const response = await fetch('/api/scenarios');
    
    if (!response.ok) {
      throw new Error('Failed to fetch scenarios');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    throw error;
  }
}

/**
 * Fetch a specific scenario by ID
 */
export async function fetchScenarioById(id: string): Promise<Scenario> {
  try {
    console.log(`Client: Requesting scenario with ID: ${id}`);
    const response = await fetch(`/api/scenarios/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`Error response from server (${response.status}):`, errorData);
      throw new Error(`Failed to fetch scenario (${response.status}): ${errorData?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log(`Client: Successfully received scenario data for ID: ${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching scenario ${id}:`, error);
    throw error;
  }
}

/**
 * Generate an AI response for the user's message
 */
export async function generateChatResponse(
  gameState: GameState, 
  message: string
): Promise<string | { text: string; attributeReward?: { attribute: string; amount: number; reason: string } }> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, message }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate response');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

// Export skill-related functions
export * from './skills';

// Export image-related functions
export * from './images';

// Export reward-related functions
export * from './rewards'; 