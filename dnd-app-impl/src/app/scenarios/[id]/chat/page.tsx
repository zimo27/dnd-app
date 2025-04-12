'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchScenarioById, generateChatResponse } from '@/lib/api';
import { Message, GameState } from '@/shared/types/game';
import { useAuth } from '@/lib/auth';
import Header from '@/components/ui/Header';

export default function ChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize game state and welcome message
  useEffect(() => {
    async function initialize() {
      try {
        // Get scenario details
        const scenario = await fetchScenarioById(params.id as string);
        
        // Create initial game state
        const newGameState: GameState = {
          id: `game_${Date.now()}`,
          user_id: user?.id || 'anonymous',
          scenario_id: params.id as string,
          character_data: {
            attributes: {},
            skills: {},
            customizations: {}
          },
          history: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setGameState(newGameState);
        
        // Add initial system message
        setMessages([
          {
            id: '1',
            content: `Welcome to "${scenario.title}"! I am your AI game master. How would you like to begin your adventure?`,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
        
        setInitialLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setInitialLoading(false);
      }
    }

    initialize();
  }, [params.id, user]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !gameState) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Update game state with the new message
      const updatedGameState = {
        ...gameState,
        history: [
          ...gameState.history,
          {
            message: userMessage.content,
            sender: 'user',
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      };
      
      setGameState(updatedGameState);
      
      // Get AI response
      const aiResponseText = await generateChatResponse(updatedGameState, userMessage.content);
      
      // Create AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update game state with AI response
      setGameState({
        ...updatedGameState,
        history: [
          ...updatedGameState.history,
          {
            message: aiResponseText,
            sender: 'system',
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I couldn't generate a response. Please try again.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Header and Navigation */}
      <Header />
      
      {/* Back to Scenario Link */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <Link
            href={`/scenarios/${params.id}`}
            className="text-purple-400 hover:text-purple-300 transition-colors duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scenario
          </Link>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="text-sm md:text-base">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator for AI response */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-200 max-w-[80%] rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-gray-400 ml-2"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-700 bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 