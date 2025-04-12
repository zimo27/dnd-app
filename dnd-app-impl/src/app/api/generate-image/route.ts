import { NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/shared/types/game';
import { getScenarioById } from '@/backend/services/game/scenarios';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST handler for generating character images
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, scenarioTitle } = await request.json();
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the full scenario data for better context
    const scenario = await getScenarioById(gameState.scenario_id);
    if (!scenario) {
      return NextResponse.json(
        { error: 'Invalid scenario' },
        { status: 400 }
      );
    }
    
    // Prepare a detailed prompt for image generation
    const characterCustomizations = gameState.character_data.customizations;
    const characterDetails = Object.entries(characterCustomizations)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    // Scenario: ${scenario['Dnd-Scenario'] || scenarioTitle || scenario.title}
    //  in the style of a comic cartoon
    const prompt = `Create a detailed, high-quality character portrait for a role-playing game. 
    Character details: ${characterDetails}
    Setting: ${scenario.description || ''}
    
    Create a portrait that represents this character, with details that reflect their role and background. Use vibrant colors and dramatic lighting. The character should look distinctive and memorable with facial features clearly visible. 
    
    IMPORTANT: DO NOT include any text, words, letters, numbers or writing in the image`;
    
    // Make request to OpenAI for image generation
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });
    
    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }
    
    return NextResponse.json({ 
      imageUrl,
      prompt
    }, { status: 200 });
  } catch (error) {
    console.error('Error in generate-image API:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 