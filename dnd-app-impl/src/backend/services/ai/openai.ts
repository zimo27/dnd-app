import OpenAI from 'openai';
import { GameState } from '@/shared/types/game';
import { getScenarioById } from '../game/scenarios';
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the reward attributes function
const rewardAttributeFunction = {
  name: "reward_attribute",
  description: "Award the player a small attribute increase as a reward for their accomplishments",
  parameters: {
    type: "object",
    properties: {
      attribute: {
        type: "string",
        description: "The attribute to increase (must be one of the player's existing attributes)",
      },
      amount: {
        type: "number",
        description: "The amount to increase the attribute by (should be small, between 0.1 and 2)",
      },
      reason: {
        type: "string",
        description: "A brief explanation of why the player earned this reward",
      }
    },
    required: ["attribute", "amount", "reason"]
  }
};

/**
 * Generate a response for the game scenario based on user input
 */
export async function generateResponse(
  gameState: GameState,
  userMessage: string
): Promise<string | { text: string; attributeReward?: { attribute: string; amount: number; reason: string } }> {
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

REWARD SYSTEM:
You can reward players with small attribute increases when they achieve significant goals, overcome challenges, 
or demonstrate growth in a specific area. Use the reward_attribute function to grant these rewards.
- Only reward players every 3 rounds of conversation
- Keep rewards small (0.5 to 1 point typically)
- Choose attributes that match what the player demonstrated (e.g., Intelligence for solving puzzles)
- Provide a clear reason for the reward in your narrative
- Do NOT offer attribute decreases
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
      functions: [rewardAttributeFunction],
      function_call: "auto",
    });

    const message = completion.choices[0].message;
    
    // Check if the AI decided to call the reward function
    if (message.function_call && message.function_call.name === "reward_attribute") {
      try {
        console.log('🎁 REWARD FUNCTION CALLED:', message.function_call.name);
        
        const functionArgs = JSON.parse(message.function_call.arguments);
        const { attribute, amount, reason } = functionArgs;
        
        console.log('🎁 REWARD DETAILS:', { attribute, amount, reason });
        
        // Validate attribute exists
        if (!scenario.attributes?.[attribute]) {
          console.error('❌ REWARD ERROR: Invalid attribute:', attribute);
          throw new Error(`Invalid attribute: ${attribute}`);
        }
        
        // Validate amount is reasonable
        const validatedAmount = Math.min(Math.max(0.1, amount), 2);
        if (validatedAmount !== amount) {
          console.log('⚠️ REWARD AMOUNT ADJUSTED:', { original: amount, adjusted: validatedAmount });
        }
        
        console.log('✅ REWARD VALIDATED:', { 
          attribute, 
          amount: validatedAmount, 
          reason,
          currentValue: gameState.character_data.attributes[attribute] || 0,
          newValue: (gameState.character_data.attributes[attribute] || 0) + validatedAmount
        });
        
        // Return both the text content and the attribute reward
        return {
          text: message.content || `You've made significant progress in your adventure. Your ${attribute} has increased!`,
          attributeReward: {
            attribute,
            amount: validatedAmount,
            reason
          }
        };
      } catch (error) {
        console.error('❌ REWARD ERROR:', error);
        // Fall back to just returning the message
        return message.content || "I'm not sure how to respond to that.";
      }
    } else {
      console.log('ℹ️ NO REWARD FUNCTION CALLED IN THIS RESPONSE');
    }

    return message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
} 