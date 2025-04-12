import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/backend/services/ai/openai';
import { GameState } from '@/shared/types/game';

/**
 * POST handler for generating AI responses in the chat
 */
export async function POST(request: NextRequest) {
  try {
    const { gameState, message } = await request.json();
    
    if (!gameState || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const aiResponse = await generateResponse(gameState as GameState, message);
    
    return NextResponse.json({ 
      response: aiResponse
    }, { status: 200 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 