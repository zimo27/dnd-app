'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RhythmMatchingGameProps {
  onComplete: (success: boolean) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  targetMatches?: number;
}

type KeyName = 'A' | 'W' | 'S' | 'D';
type KeyState = 'inactive' | 'coming' | 'active' | 'success' | 'fail' | 'missed';

interface KeyData {
  key: KeyName;
  state: KeyState;
  progress: number; // 0-100 to show approach animation
}

const RhythmMatchingGame: React.FC<RhythmMatchingGameProps> = ({
  onComplete,
  difficulty = 'medium',
  targetMatches = 10,
}) => {
  // Game state
  const [keys, setKeys] = useState<KeyData[]>([
    { key: 'A', state: 'inactive', progress: 0 },
    { key: 'W', state: 'inactive', progress: 0 },
    { key: 'S', state: 'inactive', progress: 0 },
    { key: 'D', state: 'inactive', progress: 0 },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [missedKeys, setMissedKeys] = useState(0);
  const [gameResult, setGameResult] = useState<'success' | 'failure' | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  
  // Configuration based on difficulty
  const difficultySettings = {
    easy: {
      spawnInterval: 1500, // ms
      moveSpeed: 0.8, // progress units per frame
      successWindow: 15, // progress units for successful hit
      maxMisses: 5,
      minKeySpacing: 1200, // ms between sequential keys
    },
    medium: {
      spawnInterval: 1200,
      moveSpeed: 1.0,
      successWindow: 12,
      maxMisses: 4,
      minKeySpacing: 1000,
    },
    hard: {
      spawnInterval: 1000,
      moveSpeed: 1.2,
      successWindow: 10,
      maxMisses: 3,
      minKeySpacing: 800,
    },
  };
  
  const settings = difficultySettings[difficulty];
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to spawn a new key
  const spawnKey = useCallback(() => {
    const now = Date.now();
    // Check time since last key was spawned
    if (now - lastKeyTimeRef.current < settings.minKeySpacing) {
      return; // Don't spawn a key yet if the minimum spacing hasn't elapsed
    }
    
    setKeys(prevKeys => {
      const availableKeys = prevKeys.filter(k => k.state === 'inactive');
      if (availableKeys.length === 0) return prevKeys; // No changes if no keys available
      
      // Choose a random key from available keys
      const randomIndex = Math.floor(Math.random() * availableKeys.length);
      const keyToActivate = availableKeys[randomIndex].key;
      
      // Update the last key time
      lastKeyTimeRef.current = now;
      
      return prevKeys.map(k => 
        k.key === keyToActivate ? { ...k, state: 'coming' as KeyState, progress: 0 } : k
      );
    });
  }, [settings.minKeySpacing]);
  
  // Start the game when button is clicked
  const handleStartGame = () => {
    setGameStarted(true);
    setIsRunning(true);
    setScore(0);
    setMissedKeys(0);
    setGameResult(null);
    lastKeyTimeRef.current = Date.now() - settings.minKeySpacing; // Make sure we can spawn a key immediately
    setKeys([
      { key: 'A', state: 'inactive', progress: 0 },
      { key: 'W', state: 'inactive', progress: 0 },
      { key: 'S', state: 'inactive', progress: 0 },
      { key: 'D', state: 'inactive', progress: 0 },
    ]);
    
    // Schedule the initial key spawn
    initialSpawnTimeoutRef.current = setTimeout(() => {
      spawnKey();
    }, 1000);
    
    // Set up the regular interval for spawning keys
    spawnTimerRef.current = setInterval(() => {
      spawnKey();
    }, settings.spawnInterval);
  };
  
  // Clean up timers when component unmounts or when game state changes
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
      if (initialSpawnTimeoutRef.current) {
        clearTimeout(initialSpawnTimeoutRef.current);
      }
    };
  }, [isRunning]);
  
  // Animation loop for approaching keys
  const animate = useCallback(() => {
    if (!isRunning) return;
    
    setKeys(prev => {
      const newKeys = prev.map(k => {
        if (k.state === 'coming') {
          const newProgress = k.progress + settings.moveSpeed;
          
          // Mark as missed if it goes past 100
          if (newProgress > 100) {
            setMissedKeys(m => m + 1);
            return { ...k, state: 'missed' as KeyState, progress: 100 };
          }
          
          return { ...k, progress: newProgress };
        }
        
        // Reset missed or success/fail states after a short delay
        if (k.state === 'missed' || k.state === 'success' || k.state === 'fail') {
          if (k.progress > 0) {
            return { ...k, progress: Math.max(0, k.progress - 5) };
          } else {
            return { ...k, state: 'inactive' as KeyState, progress: 0 };
          }
        }
        
        return k;
      });
      
      return newKeys;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, settings.moveSpeed]);
  
  // Start animation when isRunning changes
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isRunning]);
  
  // Handle key presses
  useEffect(() => {
    if (!isRunning) return;
    
    const keyMap: Record<string, KeyName> = {
      'a': 'A',
      'w': 'W',
      's': 'S',
      'd': 'D',
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mappedKey = keyMap[key];
      
      if (!mappedKey) return;
      
      // Find the matching key data
      const keyData = keys.find(k => k.key === mappedKey);
      if (!keyData || keyData.state !== 'coming') return;
      
      // Check if the key is pressed in the success window
      const isSuccess = Math.abs(keyData.progress - 85) <= settings.successWindow;
      
      setKeys(prev => prev.map(k => 
        k.key === mappedKey 
          ? { 
              ...k, 
              state: isSuccess ? 'success' as KeyState : 'fail' as KeyState,
            }
          : k
      ));
      
      if (isSuccess) {
        setScore(prev => prev + 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, keys, settings.successWindow]);
  
  // Check game end conditions
  useEffect(() => {
    // Win condition
    if (score >= targetMatches) {
      endGame(true);
    }
    
    // Lose condition
    if (missedKeys >= settings.maxMisses) {
      endGame(false);
    }
  }, [score, missedKeys, targetMatches, settings.maxMisses]);
  
  // End game function
  const endGame = (success: boolean) => {
    setIsRunning(false);
    setGameResult(success ? 'success' : 'failure');
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (spawnTimerRef.current !== null) {
      clearInterval(spawnTimerRef.current);
    }
    
    if (initialSpawnTimeoutRef.current !== null) {
      clearTimeout(initialSpawnTimeoutRef.current);
    }
    
    // Notify parent component
    setTimeout(() => {
      onComplete(success);
    }, 1500);
  };
  
  // If game hasn't started, show the start screen
  if (!gameStarted) {
    return (
      <div className="relative my-4 bg-gray-800 rounded-lg p-4 shadow-lg w-full max-w-md mx-auto">
        <h3 className="text-center text-white font-bold mb-4">Rhythm Challenge</h3>
        <p className="text-center text-gray-300 mb-6">
          The president is upset! Show off your rhythm skills to calm him down.
          Press the keys (A, W, S, D) when they reach the target zone.
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-200"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative my-4 bg-gray-800 rounded-lg p-4 shadow-lg w-full max-w-md mx-auto">
      <h3 className="text-center text-white font-bold mb-2">Appease the President</h3>
      <p className="text-center text-gray-300 mb-4">Press the keys (A, W, S, D) when they reach the target zone!</p>
      
      <div className="flex justify-between mb-2">
        <div className="text-white font-bold">Score: {score}/{targetMatches}</div>
        <div className="text-white font-bold">Misses: {missedKeys}/{settings.maxMisses}</div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        {keys.map((keyData) => (
          <div key={keyData.key} className="relative">
            {/* Key lane */}
            <div 
              className="h-60 bg-gray-700 rounded-lg overflow-hidden"
              style={{ position: 'relative' }}
            >
              {/* Active zone */}
              <div 
                className="absolute w-full bg-green-500 opacity-30 rounded-lg"
                style={{ 
                  bottom: '15%',
                  height: '15%',
                }}
              />
              
              {/* Approaching key */}
              {(keyData.state === 'coming' || keyData.state === 'success' || keyData.state === 'fail' || keyData.state === 'missed') && (
                <div 
                  className={`absolute w-12 h-12 left-1/2 transform -translate-x-1/2 flex items-center justify-center rounded-full transition-all duration-100 ${
                    keyData.state === 'coming' ? 'bg-blue-500' :
                    keyData.state === 'success' ? 'bg-green-500' :
                    keyData.state === 'fail' ? 'bg-red-500' :
                    'bg-gray-500 opacity-50'
                  }`}
                  style={{ 
                    bottom: `${100 - keyData.progress}%`,
                  }}
                >
                  <span className="text-white font-bold text-lg">{keyData.key}</span>
                </div>
              )}
            </div>
            
            {/* Key label */}
            <div className="mt-2 bg-gray-600 rounded-lg py-2 text-center">
              <span className="text-white font-bold">{keyData.key}</span>
            </div>
          </div>
        ))}
      </div>
      
      {gameResult !== null && (
        <div className={`mt-3 text-center font-bold ${
          gameResult === 'success' ? 'text-green-500' : 'text-red-500'
        }`}>
          {gameResult === 'success' 
            ? 'Success! The president is now calm.'
            : 'Failed! The president is still angry.'}
        </div>
      )}
    </div>
  );
};

export default RhythmMatchingGame; 