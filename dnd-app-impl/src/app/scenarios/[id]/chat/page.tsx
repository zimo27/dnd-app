'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchScenarioById, generateChatResponse, generateStoryStructure } from '@/lib/api';
import { performSkillCheck, getNarrativeForSkill } from '@/lib/api/skills';
import { applyAttributeReward, checkRewardsForSkill } from '@/lib/api/rewards';
import { Message, GameState, Scenario, SkillCheckResult } from '@/shared/types/game';
import { useAuth } from '@/lib/auth';
import Header from '@/components/ui/Header';
import CharacterImage from '@/components/ui/CharacterImage';
import { checkForRewards } from '@/backend/services/ai/openai';

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
  const [storyStructure, setStoryStructure] = useState<{ events: string[], endingState: string } | null>(null);
  const [showStoryStructure, setShowStoryStructure] = useState(false);
  const [imageLoadTimeout, setImageLoadTimeout] = useState(false);

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
          
          // Try to load saved story structure
          const savedStoryStructure = localStorage.getItem(`storyStructure_${params.id}`);
          if (savedStoryStructure) {
            setStoryStructure(JSON.parse(savedStoryStructure));
            console.log('Loaded saved story structure:', JSON.parse(savedStoryStructure));
          }
        } else {
          // Redirect to character creation if no saved game state
          router.push(`/scenarios/${params.id}/character`);
          return;
        }
        
        setGameState(newGameState);
        
        // Generate story structure if it doesn't exist
        if (!localStorage.getItem(`storyStructure_${params.id}`)) {
          try {
            console.log('Generating story structure...');
            setInitialLoading(true);
            const structure = await generateStoryStructure(newGameState);
            setStoryStructure(structure);
            localStorage.setItem(`storyStructure_${params.id}`, JSON.stringify(structure));
            console.log('Story structure generated and saved:', structure);
          } catch (error) {
            console.error('Error generating story structure:', error);
          }
        }
        
        // Add initial system message if there's no history
        if (newGameState.history.length === 0) {
          const welcomeMessage: Message = {
            id: '1',
            content: `Welcome to "${scenarioData.title}"! I am your AI game master. ${scenarioData.startingPoint || 'How would you like to begin your adventure?'}`,
            sender: 'ai',
            timestamp: new Date(),
          };

          const introMessages: Message[] = [welcomeMessage];
          
          // If we just generated a story structure, add an introductory message
          if (!localStorage.getItem(`storyStructure_${params.id}_introduced`) && storyStructure) {
            const storyIntroMessage: Message = {
              id: '2',
              content: `I've prepared a narrative arc for our adventure with 3 key events leading to an exciting conclusion. Click "Show Game Plan" at the top to see it at any time. Let me know when you're ready to begin!`,
              sender: 'ai',
              timestamp: new Date(),
            };
            
            introMessages.push(storyIntroMessage);
            localStorage.setItem(`storyStructure_${params.id}_introduced`, 'true');
          }
          
          setMessages(introMessages);
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

  // Add a timeout for image loading to allow gameplay even if image generation fails
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isCharacterImageLoaded) {
        console.log("Image load timeout reached - allowing interaction");
        setImageLoadTimeout(true);
        setIsCharacterImageLoaded(true); // Force enable interaction
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isCharacterImageLoaded]);

  // Debug effect to track attribute changes
  useEffect(() => {
    if (gameState) {
      console.log("Game state updated, current attributes:", gameState.character_data.attributes);
    }
  }, [gameState]);

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
      
      // Get AI response with story structure guidance
      const aiResponse = await generateChatResponse(
        updatedGameState,
        userMessage.content,
        storyStructure || undefined
      );
      
      // Add debug log to see raw response from API
      console.log('Raw AI response from API:', aiResponse);
      
      let aiResponseText: string;
      let attributeReward: { attribute: string; amount: number; reason: string; achievement?: boolean; achievementTitle?: string } | null = null;
      
      // Check if the response includes an attribute reward
      if (typeof aiResponse === 'object' && aiResponse.attributeReward) {
        // Handle attribute reward
        console.group('🏆 ATTRIBUTE REWARD RECEIVED');
        console.log('Reward details:', aiResponse.attributeReward);
        
        // Properly extract the text field from the response object
        aiResponseText = typeof aiResponse.text === 'string' ? aiResponse.text : JSON.stringify(aiResponse.text);
        attributeReward = aiResponse.attributeReward as { 
          attribute: string; 
          amount: number; 
          reason: string;
          achievement?: boolean;
          achievementTitle?: string;
        };
        
        // Check if the attribute exists in the character's attributes, if not, add it
        if (!(attributeReward.attribute in updatedGameState.character_data.attributes)) {
          console.log(`Adding new attribute: ${attributeReward.attribute}`);
          // Create a copy of the gameState to avoid direct mutation
          const newGameState = { ...updatedGameState };
          newGameState.character_data = { 
            ...newGameState.character_data,
            attributes: { 
              ...newGameState.character_data.attributes,
              [attributeReward.attribute]: 0 
            }
          };
          setGameState(newGameState);
          // Use the updated state for further processing
          updatedGameState.character_data.attributes[attributeReward.attribute] = 0;
        }
        
        // Log current attributes before update
        console.log('Current attributes before update:', {
          ...updatedGameState.character_data.attributes
        });
        
        try {
          // Apply the attribute reward
          const rewardResult = await applyAttributeReward(updatedGameState, {
            attribute: attributeReward.attribute,
            amount: attributeReward.amount
          });
          
          console.log('API response from reward application:', rewardResult);
          
          // Deep clone the updated gameState to avoid reference issues
          const newGameState = JSON.parse(JSON.stringify(rewardResult.gameState)) as GameState;
          
          // Compare the attribute values to confirm update
          console.log('Attribute comparison:', {
            attribute: attributeReward.attribute,
            before: updatedGameState.character_data.attributes[attributeReward.attribute] || 0,
            after: newGameState.character_data.attributes[attributeReward.attribute] || 0,
            difference: (newGameState.character_data.attributes[attributeReward.attribute] || 0) - 
                      (updatedGameState.character_data.attributes[attributeReward.attribute] || 0)
          });
          
          // Add reward notification to messages
          let rewardMessage: Message;
          
          if (attributeReward.achievement) {
            // Format special achievement reward
            rewardMessage = {
              id: (Date.now() + 2).toString(),
              content: `🏆 ACHIEVEMENT UNLOCKED: "${attributeReward.achievementTitle || 'Achievement'}" 🏆\n\nYour ${attributeReward.attribute} has increased by ${attributeReward.amount.toFixed(1)}! ${attributeReward.reason}`,
              sender: 'ai',
              timestamp: new Date(),
            };
          } else {
            // Regular reward format
            rewardMessage = {
              id: (Date.now() + 2).toString(),
              content: `🏆 You've earned a reward! Your ${attributeReward.attribute} has increased by ${attributeReward.amount.toFixed(1)}. ${attributeReward.reason}`,
              sender: 'ai',
              timestamp: new Date(),
            };
          }
          
          // Create AI message
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: aiResponseText,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          // Add both messages
          setMessages(prev => [...prev, aiMessage, rewardMessage]);
          
          // Create a new gameState object with the updated attributes and history
          const finalGameState = {
            ...newGameState,
            history: [
              ...newGameState.history,
              {
                message: aiResponseText,
                sender: 'system' as 'user' | 'system',
                timestamp: new Date().toISOString(),
              },
              {
                message: rewardMessage.content,
                sender: 'system' as 'user' | 'system',
                timestamp: new Date().toISOString(),
                reward: {
                  type: attributeReward.achievement ? 'achievement' as 'attribute' | 'achievement' : 'attribute' as 'attribute' | 'achievement',
                  attribute: attributeReward.attribute,
                  amount: attributeReward.amount,
                  ...(attributeReward.achievement ? { achievementTitle: attributeReward.achievementTitle } : {})
                }
              }
            ],
            updated_at: new Date().toISOString(),
          };
          
          // Log the final gameState
          console.log('Final gameState after reward:', {
            attributes: finalGameState.character_data.attributes,
            attribute: attributeReward.attribute,
            value: finalGameState.character_data.attributes[attributeReward.attribute]
          });
          console.groupEnd();
          
          // Save the game state
          setGameState(finalGameState);
          
          // Immediately save to localStorage to make sure it persists
          localStorage.setItem(`gameState_${params.id}`, JSON.stringify(finalGameState));
          
          // Additional verification after saving to localStorage
          setTimeout(() => {
            const savedState = localStorage.getItem(`gameState_${params.id}`);
            if (savedState && attributeReward) {
              const parsedState = JSON.parse(savedState) as GameState;
              console.log('VERIFICATION - Value in localStorage:', {
                attribute: attributeReward.attribute,
                value: parsedState.character_data.attributes[attributeReward.attribute]
              });
            }
          }, 100);
        } catch (error) {
          console.error('Error applying reward:', error);
          // If there's an error with the reward, still show the AI response
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: aiResponseText,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Update game state with AI response only
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
        }
      } else {
        // Handle regular response
        aiResponseText = typeof aiResponse === 'string' ? aiResponse : 
                        (aiResponse && typeof aiResponse.text === 'string' ? aiResponse.text : JSON.stringify(aiResponse));
        
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
      }
      
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
    
    // If this is the first interaction and the image is not loaded yet, and we haven't timed out, don't proceed
    if (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout) return;
    
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
      
      // Add the AI narrative message
      setMessages(prev => [...prev, aiMessage]);
      
      // Get the game state with the AI narrative response
      const gameStateWithNarrative: GameState = {
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
      };
      
      // Check for rewards after the skill use
      try {
        // Make a separate call to check for rewards based on the skill use
        const rewardCheckResult = await checkRewardsForSkill(gameStateWithNarrative, skillMessage.content, narrativeResponse);
        
        if (rewardCheckResult.attributeReward) {
          console.group('🏆 SKILL REWARD RECEIVED');
          console.log('Reward details:', rewardCheckResult.attributeReward);
          
          const attributeReward = rewardCheckResult.attributeReward as {
            attribute: string;
            amount: number;
            reason: string;
            achievement?: boolean;
            achievementTitle?: string;
          };
          
          // Check if the attribute exists in the character's attributes, if not, add it
          if (!(attributeReward.attribute in gameStateWithNarrative.character_data.attributes)) {
            console.log(`Adding new attribute: ${attributeReward.attribute}`);
            gameStateWithNarrative.character_data.attributes[attributeReward.attribute] = 0;
          }
          
          // Apply the attribute reward
          const rewardApplyResult = await applyAttributeReward(gameStateWithNarrative, {
            attribute: attributeReward.attribute,
            amount: attributeReward.amount
          });
          
          // Get the updated game state with the reward
          const newGameState = JSON.parse(JSON.stringify(rewardApplyResult.gameState)) as GameState;
          
          // Create reward message based on whether it's an achievement or regular reward
          let rewardMessage: Message;
          
          if (attributeReward.achievement) {
            // Format special achievement reward
            rewardMessage = {
              id: (Date.now() + 3).toString(),
              content: `🏆 ACHIEVEMENT UNLOCKED: "${attributeReward.achievementTitle || 'Achievement'}" 🏆\n\nYour ${attributeReward.attribute} has increased by ${attributeReward.amount.toFixed(1)}! ${attributeReward.reason}`,
              sender: 'ai',
              timestamp: new Date(),
            };
          } else {
            // Regular reward format
            rewardMessage = {
              id: (Date.now() + 3).toString(),
              content: `🏆 You've earned a reward! Your ${attributeReward.attribute} has increased by ${attributeReward.amount.toFixed(1)}. ${attributeReward.reason}`,
              sender: 'ai',
              timestamp: new Date(),
            };
          }
          
          // Add the reward message
          setMessages(prev => [...prev, rewardMessage]);
          
          // Update the game state with the reward message
          const finalGameState = {
            ...newGameState,
            history: [
              ...newGameState.history,
              {
                message: rewardMessage.content,
                sender: 'system' as 'user' | 'system',
                timestamp: new Date().toISOString(),
                reward: {
                  type: attributeReward.achievement ? 'achievement' as 'attribute' | 'achievement' : 'attribute' as 'attribute' | 'achievement',
                  attribute: attributeReward.attribute,
                  amount: attributeReward.amount,
                  ...(attributeReward.achievement ? { achievementTitle: attributeReward.achievementTitle } : {})
                }
              }
            ],
            updated_at: new Date().toISOString(),
          };
          
          // Set the final game state
          setGameState(finalGameState);
          console.groupEnd();
        } else {
          // If no reward, just set the state with the narrative response
          setGameState(gameStateWithNarrative);
        }
      } catch (rewardError) {
        console.error('Error checking for rewards after skill use:', rewardError);
        // If there's an error with rewards, just set the state with the narrative response
        setGameState(gameStateWithNarrative);
      }
      
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

  // Add this function to handle rendering achievement messages with special styling
  const renderMessage = (message: Message) => {
    const content = message.content;
    
    // Check if this is an achievement message
    if (typeof content === 'string' && content.includes('🏆 ACHIEVEMENT UNLOCKED:')) {
      // Parse achievement title
      const titleMatch = content.match(/🏆 ACHIEVEMENT UNLOCKED: "([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : 'Achievement Unlocked';
      
      // Split remaining content
      const [_, ...restContent] = content.split('\n\n');
      const description = restContent.join('\n\n');
      
      return (
        <div className="w-full">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold p-2 rounded-t-lg text-center">
            🏆 ACHIEVEMENT UNLOCKED 🏆
          </div>
          <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-4 text-black rounded-b-lg">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p>{description}</p>
          </div>
        </div>
      );
    }
    
    // Check if this is a regular reward message
    if (typeof content === 'string' && content.includes('You\'ve earned a reward!')) {
      return (
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 text-white p-4 rounded-lg">
          <p className="text-sm md:text-base">{content}</p>
        </div>
      );
    }
    
    // Check if this is a skill check message
    if (typeof content === 'string' && content.includes('[Skill Check:')) {
      // ... existing skill check rendering code ...
      return (
        <div>
          {/* Parse and display skill check message with better formatting */}
          {(() => {
            // Extract skill name, result, and roll details from message
            const skillMatch = content.match(/\[Skill Check: ([^\]]+)\]/);
            const successMatch = content.includes('successfully');
            const skillName = skillMatch ? skillMatch[1] : 'Unknown Skill';
            
            // Extract numbers using regex
            const rollMatch = content.match(/Rolled (\d+) \+ (\d+) = (\d+) vs DC (\d+)/);
            const roll = rollMatch ? rollMatch[1] : '?';
            const bonus = rollMatch ? rollMatch[2] : '?';
            const total = rollMatch ? rollMatch[3] : '?';
            const dc = rollMatch ? rollMatch[4] : '?';
            
            // Get narrative part
            const narrativePart = content.split(') ')[1] || '';
            
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
      );
    }
    
    // Default message rendering
    return (
      <p className="text-sm md:text-base">
        {typeof content === 'object' ? JSON.stringify(content) : content}
      </p>
    );
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
            </div>
          </div>
        </div>
      )}
      
      {/* Story Structure Panel - Toggle Button */}
      <div className="sticky top-[108px] z-10 bg-gray-800 border-b border-gray-700 py-1 px-4">
        <div className="container mx-auto flex justify-end">
          <button
            onClick={() => setShowStoryStructure(!showStoryStructure)}
            className="text-xs text-purple-400 hover:text-purple-300 py-1 px-2 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {showStoryStructure ? 'Hide Game Plan' : 'Show Game Plan'}
          </button>
        </div>
      </div>
      
      {/* Story Structure Panel - Content */}
      {showStoryStructure && storyStructure && (
        <div className="sticky top-[138px] z-10 bg-gray-800 border-b border-gray-700 py-2">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Game Plan (DM's Notes)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-indigo-300 mb-1">Key Events:</h4>
                  <ol className="list-decimal list-inside text-xs text-white space-y-1 pl-1">
                    {storyStructure.events.map((event, index) => (
                      <li key={index} className="text-gray-200">
                        {event}
                      </li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-indigo-300 mb-1">Ending Goal:</h4>
                  <p className="text-xs text-gray-200">{storyStructure.endingState}</p>
                </div>
                
                <div className="text-xs text-gray-400 italic">
                  Note: This is just a guide for the DM. Your choices will shape how the story unfolds.
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
                  console.log("Character image loaded or load handling complete");
                }}
              />
              
              {/* First interaction loading message */}
              {isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout && (
                <div className="mt-4 text-center">
                  <div className="animate-pulse text-purple-400 font-medium">
                    Generating your character image...
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    You'll be able to interact in a moment
                  </p>
                </div>
              )}
              
              {imageLoadTimeout && (
                <div className="mt-4 text-center text-yellow-400 text-sm">
                  Continuing without character image
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
                    : typeof message.content === 'string' && message.content.includes('[Skill Check:')
                      ? 'bg-gray-800 border border-indigo-500 text-gray-200'
                      : typeof message.content === 'string' && message.content.includes('🏆 ACHIEVEMENT UNLOCKED:')
                        ? 'p-0 overflow-hidden' // Container for achievement messages
                        : typeof message.content === 'string' && message.content.includes('🏆 You\'ve earned a reward!')
                          ? 'p-0' // No padding for reward messages
                          : 'bg-gray-700 text-gray-200'
                }`}
              >
                {renderMessage(message)}
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
                        disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout)}
                        className={`
                          px-3 py-1.5 rounded text-sm flex items-center whitespace-nowrap
                          ${isLoading || (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
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
              placeholder={isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout ? "Waiting for character image..." : "Type your message..."}
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout)}
            />
            <button
              type="submit"
              disabled={isLoading || (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (isFirstInteraction && !isCharacterImageLoaded && !imageLoadTimeout) ? (
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