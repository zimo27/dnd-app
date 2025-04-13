import { NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/shared/types/game';
import { getScenarioById } from '@/backend/services/game/scenarios';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Store of recent requests by character ID
const requestLog: Record<string, number[]> = {};

// Clean up old requests periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(requestLog).forEach(key => {
    requestLog[key] = requestLog[key].filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    if (requestLog[key].length === 0) {
      delete requestLog[key];
    }
  });
}, 60 * 1000); // Clean up every minute

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
    
    // Implement rate limiting
    const characterId = gameState.id;
    
    // Initialize if not exists
    if (!requestLog[characterId]) {
      requestLog[characterId] = [];
    }
    
    // Check if we're over the rate limit
    const now = Date.now();
    const recentRequests = requestLog[characterId].filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`Rate limit exceeded for character ${characterId}. ${recentRequests.length} requests in the last minute.`);
      return NextResponse.json(
        { error: 'Too many image generation requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Log this request
    requestLog[characterId].push(now);
    
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
  } catch (error: any) {
    console.error('Error in generate-image API:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to generate image';
    let statusCode = 500;
    
    if (error.status === 429 || (error.error && error.error.code === 'rate_limit_exceeded')) {
      errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.status === 400) {
      errorMessage = 'Invalid request parameters for image generation';
      statusCode = 400;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 