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
        description: "The attribute to increase (e.g. Strength, Intelligence, Wisdom, etc)",
      },
      amount: {
        type: "number",
        description: "Amount to increase the attribute by (typically 0.5-2)",
      },
      reason: {
        type: "string",
        description: "A brief explanation of why the player earned this reward",
      },
      achievement: {
        type: "boolean",
        description: "Whether this is a special achievement that should be announced prominently",
      },
      achievementTitle: {
        type: "string",
        description: "A short title for the achievement (if achievement is true)",
      }
    },
    required: ["attribute", "amount", "reason"],
  },
};

/**
 * Generate an initial story structure with key events and ending
 */
export async function generateStoryStructure(
  gameState: GameState
): Promise<{ events: string[], endingState: string }> {
  try {
    console.log('🎮 GENERATING STORY STRUCTURE');
    
    // Get the full scenario data to provide context
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${gameState.scenario_id} not found`);
    }

    // Construct a prompt to generate the story structure
    const structurePrompt = `
As a game designer, create a compelling story structure for this D&D-style scenario: ${scenario['Dnd-Scenario'] || scenario.title}. 
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

Create a story arc with 3 major events and an engaging ending state that is achievable within a short play session.

Your response should be in JSON format with the following structure:
{
  "events": [
    "Event 1 description - This should be challenging but achievable",
    "Event 2 description - This should build on the first event",
    "Event 3 description - This should lead to the climax"
  ],
  "endingState": "A description of how the story can conclude in a satisfying way"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a game designer creating a story structure for a D&D-style RPG." },
        { role: "user", content: structurePrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('Failed to generate story structure');
    }
    
    try {
      const storyStructure = JSON.parse(content);
      console.log('✅ STORY STRUCTURE GENERATED:', storyStructure);
      return storyStructure;
    } catch (error) {
      console.error('❌ ERROR PARSING STORY STRUCTURE:', error);
      throw new Error('Failed to parse story structure');
    }
  } catch (error) {
    console.error('❌ ERROR GENERATING STORY STRUCTURE:', error);
    throw new Error('Failed to generate story structure');
  }
}

/**
 * Generate a response for the game scenario based on user input
 */
export async function generateResponse(
  gameState: GameState,
  userMessage: string,
  storyStructure?: { events: string[], endingState: string } | null,
  customPrompt?: string
): Promise<string> {
  try {
    // Get the full scenario data to provide better context
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${gameState.scenario_id} not found`);
    }

    // Construct a detailed system prompt with scenario and character information
    let systemPrompt = `
You are a role-playing game master for the D&D-style scenario: ${scenario['Dnd-Scenario'] || scenario.title}. 
${scenario.description || ''}

SCENARIO CONTEXT:
${scenario.startingPoint || ''}

${storyStructure ? `
STORY STRUCTURE (Follow this narrative arc):
KEY EVENTS:
${storyStructure.events.map((event, index) => `${index + 1}. ${event}`).join('\n')}

ENDING GOAL:
${storyStructure.endingState}
` : ''}

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

${gameState.miniGameResult ? `
MINI-GAME STATUS:
The player has completed a mini-game with result: ${gameState.miniGameResult}.
This should influence your response accordingly.
` : ''}

As the game master, respond to the player's actions while:
1. Considering their attributes and skills when determining success probabilities
2. Creating challenges appropriate to the scenario
3. Maintaining the tone and context of the chosen scenario
4. Responding in character and advancing the story based on the player's input
5. Keep the response concise and short, within 100 words
${storyStructure ? '6. Guiding the narrative toward the next key event or the ending goal' : ''}

Focus on advancing the story and providing an engaging response to the player's actions.
`;

    // Add custom prompt if provided
    if (customPrompt) {
      systemPrompt += `\n\nSPECIAL INSTRUCTION:\n${customPrompt}`;
    }

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

    const message = completion.choices[0].message;
    return message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Check if the player should be rewarded based on their latest interaction
 */
export async function checkForRewards(
  gameState: GameState,
  userMessage: string,
  aiResponse: string
): Promise<{ attributeReward?: { attribute: string; amount: number; reason: string; achievement?: boolean; achievementTitle?: string } }> {
  try {
    // Reduced minimum history for rewards - allows rewards to happen sooner
    if (gameState.history.length < 3) {
      console.log('ℹ️ Not enough message history for reward check');
      return {};
    }
    
    // Determine if this is a skill check
    const isSkillCheck = userMessage.toLowerCase().includes('skill') || 
                        aiResponse.toLowerCase().includes('skill check') || 
                        aiResponse.includes('[Skill Check:');
    
    // Get the full scenario data to provide context
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${gameState.scenario_id} not found`);
    }

    // Check for success in the AI response if this is a skill check
    const isSuccessfulSkillCheck = isSkillCheck && 
                                (aiResponse.toLowerCase().includes('success') || 
                                 aiResponse.toLowerCase().includes('succeeded') ||
                                 aiResponse.toLowerCase().includes('successfully'));
    
    // If it's a failed skill check, don't even consider a reward
    if (isSkillCheck && !isSuccessfulSkillCheck) {
      console.log('ℹ️ Skipping reward check for failed skill check');
      return {};
    }

    // Construct a prompt focused on determining rewards
    const rewardPrompt = `
You are a reward evaluator for a role-playing game. Your job is to determine if the player deserves an attribute increase 
based on their actions and accomplishments.

SCENARIO CONTEXT:
${scenario['Dnd-Scenario'] || scenario.title}: ${scenario.description || ''}

PLAYER CHARACTER:
${Object.entries(gameState.character_data.customizations || {})
  .map(([category, choice]) => `- ${category}: ${choice}`)
  .join('\n')}

PLAYER ATTRIBUTES:
${Object.entries(gameState.character_data.attributes || {})
  .map(([attr, value]) => `- ${attr}: ${value} (${scenario.attributes?.[attr] || ''})`)
  .join('\n')}

RECENT CONVERSATION:
${gameState.history.slice(-5).map(msg => 
  `${msg.sender === 'user' ? 'PLAYER' : 'GAME MASTER'}: ${msg.message}`
).join('\n')}

LATEST PLAYER ACTION:
${userMessage}

GAME MASTER RESPONSE:
${aiResponse}

REWARD SYSTEM RULES:
${isSkillCheck ? `- This is a skill check action, be especially selective and rewarding for skill use
- Only reward truly exceptional and creative use of skills
- Most routine skill checks should NOT be rewarded` : 
`- Be generous with rewards to maintain player engagement
- Reward players every 2-3 rounds of conversation for text interactions`}
- Only reward meaningful, successful actions - never reward failures
- Typical attribute increases are 0.5 to 1.5 points
- For exceptional accomplishments, give 2-3 points and mark as an "achievement" with a title
- Choose attributes that match what the player demonstrated (e.g., Intelligence for solving puzzles)
- Provide a clear reason for the reward in your evaluation
- Rewards should acknowledge creative problem-solving, role-playing effort, or character development
- Make attribute names descriptive and relevant to what the player demonstrated
- Do NOT offer attribute decreases

Evaluate if the player has accomplished something significant that deserves a reward. If yes, use the reward_attribute function.
If not, do not call any function. ${isSkillCheck ? 'For skill checks, be very selective - only the most creative and impactful uses should be rewarded.' : 'Try to find reasons to reward good text interactions.'}
`;

    // Make a separate call to evaluate rewards
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: rewardPrompt }
      ],
      temperature: isSkillCheck ? 0.3 : 0.6, // Lower temperature for skill checks to be more consistent
      max_tokens: 300,
      functions: [rewardAttributeFunction],
      function_call: "auto",
    });

    const message = completion.choices[0].message;
    
    // Check if the AI decided to call the reward function
    if (message.function_call && message.function_call.name === "reward_attribute") {
      try {
        console.log('🎁 REWARD FUNCTION CALLED:', message.function_call.name);
        console.log('🎁 RAW FUNCTION ARGUMENTS:', message.function_call.arguments);
        
        const functionArgs = JSON.parse(message.function_call.arguments);
        const { attribute, amount, reason, achievement, achievementTitle } = functionArgs;
        
        console.log('🎁 REWARD DETAILS:', { attribute, amount, reason, achievement, achievementTitle });
        
        // Validate amount is reasonable but allow for higher rewards
        const validatedAmount = Math.min(Math.max(0.1, amount), 3);
        if (validatedAmount !== amount) {
          console.log('⚠️ REWARD AMOUNT ADJUSTED:', { original: amount, adjusted: validatedAmount });
        }
        
        // Log the attributes that exist in this scenario
        console.log('📊 AVAILABLE ATTRIBUTES:', Object.keys(gameState.character_data.attributes || {}));
        
        console.log('✅ REWARD VALIDATED:', { 
          attribute, 
          amount: validatedAmount, 
          reason,
          achievement: achievement || false,
          achievementTitle: achievementTitle || '',
          currentValue: gameState.character_data.attributes[attribute] || 0,
          newValue: (gameState.character_data.attributes[attribute] || 0) + validatedAmount
        });
        
        // Return the attribute reward details
        return {
          attributeReward: {
            attribute,
            amount: validatedAmount,
            reason,
            achievement: achievement || false,
            achievementTitle: achievementTitle || ''
          }
        };
      } catch (error) {
        console.error('❌ REWARD ERROR:', error);
        return {};
      }
    } else {
      console.log('ℹ️ NO REWARD FUNCTION CALLED IN THIS RESPONSE');
      return {};
    }
  } catch (error) {
    console.error('Error checking for rewards:', error);
    return {};
  }
} 