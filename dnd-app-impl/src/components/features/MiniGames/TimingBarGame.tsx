'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimingBarGameProps {
  onComplete: (success: boolean) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  width?: number;
  height?: number;
}

const TimingBarGame: React.FC<TimingBarGameProps> = ({
  onComplete,
  difficulty = 'medium',
  width = 300,
  height = 60,
}) => {
  // Game state
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isRunning, setIsRunning] = useState(true);
  const [result, setResult] = useState<'success' | 'failure' | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Configuration based on difficulty
  const speedMap = {
    easy: 1,
    medium: 1.5,
    hard: 2.5,
  };
  
  const successZoneMap = {
    easy: { start: 40, end: 60 },
    medium: { start: 45, end: 55 },
    hard: { start: 47, end: 53 },
  };
  
  const speed = speedMap[difficulty];
  const successZone = successZoneMap[difficulty];
  
  // Animation loop
  const animate = useCallback(() => {
    if (!isRunning) return;
    
    setPosition((prev) => {
      let newPos = prev + direction * speed;
      
      // Bounce at edges
      if (newPos >= 100) {
        newPos = 100;
        setDirection(-1);
      } else if (newPos <= 0) {
        newPos = 0;
        setDirection(1);
      }
      
      return newPos;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, direction, speed]);
  
  // Start animation on mount
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);
  
  // Handle click to stop the slider
  const handleClick = () => {
    if (!isRunning) return;
    
    setIsRunning(false);
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Check if position is in success zone
    const success = position >= successZone.start && position <= successZone.end;
    setResult(success ? 'success' : 'failure');
    
    // Notify parent component
    setTimeout(() => {
      onComplete(success);
    }, 1500); // Delay to allow player to see the result
  };
  
  return (
    <div 
      className="relative my-4 bg-gray-800 rounded-lg p-4 shadow-lg w-full max-w-md mx-auto"
      style={{ maxWidth: `${width}px` }}
    >
      <h3 className="text-center text-white font-bold mb-2">Coffee Temperature Control</h3>
      <p className="text-center text-gray-300 mb-4">Click to stop the slider in the perfect temperature zone!</p>
      
      <div 
        className="relative bg-gray-700 rounded-full overflow-hidden cursor-pointer mb-2"
        style={{ height: `${height}px` }}
        onClick={handleClick}
      >
        {/* Success zone */}
        <div 
          className="absolute h-full bg-green-500 opacity-30"
          style={{
            left: `${successZone.start}%`,
            width: `${successZone.end - successZone.start}%`,
          }}
        />
        
        {/* Indicator */}
        <div 
          className={`absolute h-full w-1 bg-white transition-transform duration-100 ease-linear ${
            !isRunning && (result === 'success' ? 'bg-green-500' : 'bg-red-500')
          }`}
          style={{ left: `${position}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>Cold</span>
        <span>Perfect</span>
        <span>Hot</span>
      </div>
      
      {result !== null && (
        <div className={`mt-3 text-center font-bold ${
          result === 'success' ? 'text-green-500' : 'text-red-500'
        }`}>
          {result === 'success' 
            ? 'Perfect temperature! The President will be pleased.'
            : 'Temperature off! The President may not be happy.'}
        </div>
      )}
    </div>
  );
};

export default TimingBarGame; 