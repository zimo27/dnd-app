'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchScenarioById, generateChatResponse } from '@/lib/api';
import { performSkillCheck, getNarrativeForSkill } from '@/lib/api/skills';
import { Message, GameState, Scenario, SkillCheckResult } from '@/shared/types/game';
import { useAuth } from '@/lib/auth';
import Header from '@/components/ui/Header';
import CharacterImage from '@/components/ui/CharacterImage';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [showStats, setShowStats] = useState(false);
  // Note: skillCheckResult state is maintained for game logic but the display is now integrated into chat messages
  const [skillCheckResult, setSkillCheckResult] = useState<SkillCheckResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [isCharacterImageLoaded, setIsCharacterImageLoaded] = useState(false);

  // Initialize game state and welcome message
  useEffect(() => {
    async function initialize() {
      try {
        // Get scenario details
        const scenarioData = await fetchScenarioById(params.id as string);
        setScenario(scenarioData);
        
        // Try to load existing game state from localStorage
        const savedGameState = localStorage.getItem(`gameState_${params.id}`);
        let newGameState: GameState;
        
        if (savedGameState) {
          newGameState = JSON.parse(savedGameState);
          console.log('Loaded saved game state:', newGameState);
        } else {
          // Redirect to character creation if no saved game state
          router.push(`/scenarios/${params.id}/character`);
          return;
        }
        
        setGameState(newGameState);
        
        // Add initial system message if there's no history
        if (newGameState.history.length === 0) {
          setMessages([
            {
              id: '1',
              content: `Welcome to "${scenarioData.title}"! I am your AI game master. ${scenarioData.startingPoint || 'How would you like to begin your adventure?'}`,
              sender: 'ai',
              timestamp: new Date(),
            },
          ]);
        } else {
          // Convert history to messages
          const historyMessages = newGameState.history.map((historyItem, index) => ({
            id: index.toString(),
            content: historyItem.message,
            sender: historyItem.sender === 'user' ? 'user' : 'ai' as 'user' | 'ai',
            timestamp: new Date(historyItem.timestamp),
          }));
          
          setMessages(historyMessages);
        }
        
        setInitialLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setInitialLoading(false);
      }
    }

    initialize();
  }, [params.id, user, router]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(`gameState_${params.id}`, JSON.stringify(gameState));
    }
  }, [gameState, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !gameState) return;

    // If this is the first interaction and the image is not loaded yet, don't proceed
    if (isFirstInteraction && !isCharacterImageLoaded) return;

    // No longer the first interaction
    if (isFirstInteraction) {
      setIsFirstInteraction(false);
    }

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
      const updatedGameState: GameState = {
        ...gameState,
        history: [
          ...gameState.history,
          {
            message: userMessage.content,
            sender: 'user' as 'user' | 'system',
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
            sender: 'system' as 'user' | 'system',
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

  const handleUseSkill = async (skillName: string) => {
    if (!gameState || !scenario || isLoading) return;
    
    // If this is the first interaction and the image is not loaded yet, don't proceed
    if (isFirstInteraction && !isCharacterImageLoaded) return;
    
    // No longer the first interaction
    if (isFirstInteraction) {
      setIsFirstInteraction(false);
    }
    
    const skill = scenario.baseSkills?.[skillName];
    if (!skill) return;
    
    setIsLoading(true);
    
    try {
      // Use the API to perform the skill check
      const result = await performSkillCheck(gameState, skillName);
      setSkillCheckResult(result);
      
      // Add skill check message - as a user message, not AI
      const skillMessage: Message = {
        id: Date.now().toString(),
        content: `I'll use my ${skillName} skill.`,
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, skillMessage]);
      
      // Update game state with the user's skill selection
      const updatedGameState: GameState = {
        ...gameState,
        history: [
          ...gameState.history,
          {
            message: skillMessage.content,
            sender: 'user' as 'user' | 'system',
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      };
      
      setGameState(updatedGameState);
      
      // Now add the skill check result as an AI message
      const skillResultMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `[Skill Check: ${skillName}] ${result.narrativeResult} (Rolled ${result.roll} + ${result.attributeValue} = ${result.roll + result.attributeValue} vs DC ${result.difficulty})`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, skillResultMessage]);
      
      // Update game state with the skill check result
      const gameStateWithSkillCheck: GameState = {
        ...updatedGameState,
        history: [
          ...updatedGameState.history,
          {
            message: skillResultMessage.content,
            sender: 'system' as 'user' | 'system',
            timestamp: new Date().toISOString(),
            roll: {
              value: result.roll,
              attribute: result.attribute,
              modified_value: result.roll + result.attributeValue
            }
          },
        ],
        updated_at: new Date().toISOString(),
      };
      
      setGameState(gameStateWithSkillCheck);
      
      // Get narrative continuation based on skill check
      const narrativeResponse = await getNarrativeForSkill(gameStateWithSkillCheck, result);
      
      // Create AI message with narrative continuation
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: narrativeResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update game state with AI narrative response
      setGameState({
        ...gameStateWithSkillCheck,
        history: [
          ...gameStateWithSkillCheck.history,
          {
            message: narrativeResponse,
            sender: 'system' as 'user' | 'system',
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing skill check:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, there was a problem processing your skill check. Please try again.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
    
    // Auto-scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col relative">
      {/* Top section - Header and back link - Fixed */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-gray-900 to-gray-800 shadow-md">
        <Header />
        
        {/* Back to Scenario Link */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center">
            <Link
              href={`/scenarios/${params.id}`}
              className="text-purple-400 hover:text-purple-300 transition-colors duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Scenario
            </Link>
            
            {/* Character Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-purple-400 hover:text-purple-300 flex items-center text-sm"
            >
              {showStats ? 'Hide Character' : 'Show Character'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showStats ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Character Stats Panel - Conditionally Shown - Fixed */}
      {showStats && gameState && (
        <div className="sticky top-[108px] z-10 bg-gray-800 border-b border-gray-700 py-3">
          <div className="container mx-auto px-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Character Sheet</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customizations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Character</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(gameState.character_data.customizations || {}).map(([key, value]) => (
                      <div key={key} className="col-span-2 text-sm">
                        <span className="text-gray-400">{key}: </span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Attributes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Attributes</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(gameState.character_data.attributes || {}).map(([key, value]) => (
                      <div key={key} className="col-span-1 text-sm">
                        <span className="text-gray-400">{key}: </span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Skills */}
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {gameState && scenario && Object.entries(gameState.character_data.skills || {})
                    .filter(([_, isAvailable]) => isAvailable)
                    .map(([skillName, _]) => {
                      const skill = scenario.baseSkills?.[skillName];
                      const attributeValue = gameState.character_data.attributes[skill?.attribute || ''] || 0;
                      
                      return (
                        <button
                          key={skillName}
                          onClick={() => handleUseSkill(skillName)}
                          disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded)}
                          className={`
                            px-3 py-1.5 rounded text-sm flex items-center whitespace-nowrap
                            ${isLoading || (isFirstInteraction && !isCharacterImageLoaded) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
                            transition-colors duration-300
                          `}
                          title={scenario.baseSkills?.[skillName]?.description || skillName}
                        >
                          <span className="mr-1">{skillName}</span>
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">+{attributeValue}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Area - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        style={{ 
          height: "calc(100vh - 220px)", // Adjust based on header + input heights
          overflowY: "auto"
        }}
      >
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {/* Character Portrait - Display at the beginning of the chat */}
          {gameState && scenario && messages.length > 0 && (
            <div className="mb-6">
              <CharacterImage 
                gameState={gameState} 
                scenarioTitle={scenario.title || ''} 
                onLoadComplete={() => {
                  setIsCharacterImageLoaded(true);
                  console.log("Character image loaded successfully");
                }}
              />
              
              {/* First interaction loading message */}
              {isFirstInteraction && !isCharacterImageLoaded && (
                <div className="mt-4 text-center">
                  <div className="animate-pulse text-purple-400 font-medium">
                    Generating your character image...
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    You'll be able to interact once the image has loaded
                  </p>
                </div>
              )}
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.content.includes('[Skill Check:')
                      ? 'bg-gray-800 border border-indigo-500 text-gray-200'
                      : 'bg-gray-700 text-gray-200'
                }`}
              >
                {message.content.includes('[Skill Check:') ? (
                  <div>
                    {/* Parse and display skill check message with better formatting */}
                    {(() => {
                      // Extract skill name, result, and roll details from message
                      const skillMatch = message.content.match(/\[Skill Check: ([^\]]+)\]/);
                      const successMatch = message.content.includes('successfully');
                      const skillName = skillMatch ? skillMatch[1] : 'Unknown Skill';
                      
                      // Extract numbers using regex
                      const rollMatch = message.content.match(/Rolled (\d+) \+ (\d+) = (\d+) vs DC (\d+)/);
                      const roll = rollMatch ? rollMatch[1] : '?';
                      const bonus = rollMatch ? rollMatch[2] : '?';
                      const total = rollMatch ? rollMatch[3] : '?';
                      const dc = rollMatch ? rollMatch[4] : '?';
                      
                      // Get narrative part
                      const narrativePart = message.content.split(') ')[1] || '';
                      
                      return (
                        <>
                          <div className="flex items-center mb-2">
                            <span className={`font-bold mr-2 ${successMatch ? 'text-green-400' : 'text-red-400'}`}>
                              {successMatch ? 'SUCCESS!' : 'FAILED!'}
                            </span>
                            <span className="text-gray-300">{skillName} Check</span>
                          </div>
                          <div className="flex space-x-3 text-xs mb-2">
                            <div>
                              <span className="text-gray-400">Roll:</span> {roll}
                            </div>
                            <div>
                              <span className="text-gray-400">Bonus:</span> +{bonus}
                            </div>
                            <div>
                              <span className="text-gray-400">Total:</span> {total}
                            </div>
                            <div>
                              <span className="text-gray-400">DC:</span> {dc}
                            </div>
                          </div>
                          <div className="mt-2 text-sm border-t border-gray-700 pt-2">
                            {narrativePart}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm md:text-base">{message.content}</p>
                )}
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
                  <span className="text-sm text-gray-400 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom section - Input Form - Fixed */}
      <div className="sticky bottom-0 z-10 border-t border-gray-700 bg-gray-800 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          {/* Skills Bar */}
          {gameState && scenario && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300">Available Skills</h4>
                <button 
                  onClick={() => setShowStats(!showStats)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {showStats ? 'Hide Character Sheet' : 'Show Character Sheet'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
                {gameState && scenario && Object.entries(gameState.character_data.skills || {})
                  .filter(([_, isAvailable]) => isAvailable)
                  .map(([skillName, _]) => {
                    const skill = scenario.baseSkills?.[skillName];
                    const attributeValue = gameState.character_data.attributes[skill?.attribute || ''] || 0;
                    
                    return (
                      <button
                        key={skillName}
                        onClick={() => handleUseSkill(skillName)}
                        disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded)}
                        className={`
                          px-3 py-1.5 rounded text-sm flex items-center whitespace-nowrap
                          ${isLoading || (isFirstInteraction && !isCharacterImageLoaded) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
                          transition-colors duration-300
                        `}
                        title={scenario.baseSkills?.[skillName]?.description || skillName}
                      >
                        <span className="mr-1">{skillName}</span>
                        <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">+{attributeValue}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isFirstInteraction && !isCharacterImageLoaded ? "Waiting for character image to load..." : "Type your message..."}
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded)}
            />
            <button
              type="submit"
              disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : isFirstInteraction && !isCharacterImageLoaded ? (
                <div className="animate-pulse">Loading...</div>
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 