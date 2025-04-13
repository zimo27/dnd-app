'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GameState } from '@/shared/types/game';
import { generateCharacterImage } from '@/lib/api/images';

interface CharacterImageProps {
  gameState: GameState;
  scenarioTitle: string;
  onLoadComplete?: () => void;
}

export default function CharacterImage({ gameState, scenarioTitle, onLoadComplete }: CharacterImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [attemptedGeneration, setAttemptedGeneration] = useState(false);

  useEffect(() => {
    // Only run this effect once per component lifecycle for a given gameState
    // and only if we haven't already attempted generation
    if (attemptedGeneration || retryCount >= 3) return;
    
    async function loadCharacterImage() {
      // Check if we already have a cached image in localStorage
      const cachedImage = localStorage.getItem(`character_image_${gameState.id}`);
      
      if (cachedImage) {
        setImageUrl(cachedImage);
        setIsLoading(false);
        // Notify parent component that image is loaded
        onLoadComplete?.();
        return;
      }
      
      try {
        setAttemptedGeneration(true);
        setIsLoading(true);
        const url = await generateCharacterImage(gameState, scenarioTitle);
        setImageUrl(url);
        
        // Cache the image URL
        localStorage.setItem(`character_image_${gameState.id}`, url);
      } catch (err) {
        console.error('Failed to generate character image:', err);
        setRetryCount(prev => prev + 1);
        setError('Could not generate character image');
        
        // Still mark as complete after error to allow user to continue
        if (retryCount >= 2) {
          onLoadComplete?.();
        }
      } finally {
        setIsLoading(false);
        
        // Even if there was an error, we want to notify the parent that the loading is complete
        // after the third retry
        if (retryCount >= 2) {
          onLoadComplete?.();
        }
      }
    }

    loadCharacterImage();
  }, [gameState.id, scenarioTitle, onLoadComplete, attemptedGeneration, retryCount]);

  if (isLoading) {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg bg-gray-800 border border-gray-700 p-2 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400 text-sm">Generating character portrait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg bg-gray-800 border border-gray-700 p-2 flex items-center justify-center">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-600 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">Could not generate character image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shadow-lg">
      {imageUrl && (
        <div className="relative aspect-square">
          <Image 
            src={imageUrl} 
            alt="Character portrait" 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 384px"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            priority
          />
        </div>
      )}
      <div className="p-3 bg-gray-800 bg-opacity-80 absolute bottom-0 w-full">
        <p className="text-sm text-gray-300">
          {Object.entries(gameState.character_data.customizations).map(([key, value]) => (
            <span key={key} className="mr-2">
              <span className="text-gray-400">{key}:</span> {value}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
} 