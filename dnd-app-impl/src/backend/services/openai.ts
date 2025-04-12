import OpenAI from 'openai';
import { Scenario } from '@/shared/types';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Function to generate scenario response
export async function generateResponse(
  prompt: string, 
  scenarioContext: Scenario, 
  previousMessages: Array<{role: 'user' | 'system' | 'assistant', content: string}>
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a D&D game master for a scenario: ${scenarioContext['Dnd-Scenario']}. 
                    Use the player's attributes and skills to influence outcomes.
                    Keep responses engaging, narrative, and within the scenario's theme.`
        },
        ...previousMessages,
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response from OpenAI:', error);
    return 'Sorry, there was an error generating a response. Please try again.';
  }
} 