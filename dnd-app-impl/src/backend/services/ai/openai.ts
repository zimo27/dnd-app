import OpenAI from 'openai';
import { GameState } from '@/shared/types/game';
import { getScenarioById } from '../game/scenarios';
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources';

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
    // Get the full scenario data to provide better context
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${gameState.scenario_id} not found`);
    }

    // Construct a detailed system prompt with scenario and character information
    const systemPrompt = `
You are a role-playing game master for the D&D-style scenario: ${scenario['Dnd-Scenario'] || scenario.title}. 
${scenario.description || ''}

SCENARIO CONTEXT:
${scenario.startingPoint || ''}

PLAYER CHARACTER:
${Object.entries(gameState.character_data.customizations || {})
  .map(([category, choice]) => `- ${category}: ${choice}`)
  .join('\n')}

PLAYER ATTRIBUTES:
${Object.entries(gameState.character_data.attributes || {})
  .map(([attr, value]) => `- ${attr}: ${value} (${scenario.attributes?.[attr] || ''})`)
  .join('\n')}

PLAYER SKILLS:
${Object.entries(gameState.character_data.skills || {})
  .filter(([_, isAvailable]) => isAvailable)
  .map(([skillName, _]) => `- ${skillName}: ${scenario.baseSkills?.[skillName]?.description || ''}`)
  .join('\n')}

As the game master, respond to the player's actions while:
1. Considering their attributes and skills when determining success probabilities
2. Creating challenges appropriate to the scenario
3. Maintaining the tone and context of the chosen scenario
4. Responding in character and advancing the story based on the player's input
`;

    // Create properly typed messages array
    const systemMessage: ChatCompletionSystemMessageParam = {
      role: "system",
      content: systemPrompt
    };
    
    const historyMessages = gameState.history.map(message => {
      if (message.sender === 'user') {
        return {
          role: "user",
          content: message.message
        } as ChatCompletionUserMessageParam;
      } else {
        return {
          role: "assistant",
          content: message.message
        } as ChatCompletionAssistantMessageParam;
      }
    });
    
    const userMessageParam: ChatCompletionUserMessageParam = {
      role: "user",
      content: userMessage
    };
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        systemMessage,
        ...historyMessages,
        userMessageParam
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