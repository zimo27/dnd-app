import OpenAI from 'openai';
import { GameState } from '@/shared/types/game';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a response for the game scenario based on user input
 */
export async function generateResponse(
  gameState: GameState,
  userMessage: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a role-playing game master for the scenario: ${gameState.scenario_id}. 
                   The user is playing the role as described in the scenario. 
                   Respond in character and advance the story based on the user's input.`
        },
        ...gameState.history.map(message => ({
          role: message.sender === 'user' ? 'user' : 'assistant',
          content: message.message
        })),
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
} 