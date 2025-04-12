'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchScenarioById } from '@/lib/api';
import { Scenario, CharacterCreationState } from '@/shared/types/game';
import { useAuth } from '@/lib/auth';
import Header from '@/components/ui/Header';

export default function CharacterCreationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterState, setCharacterState] = useState<CharacterCreationState>({
    scenario_id: params.id as string,
    customizations: {},
    attributes: {},
    skills: {}
  });
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [customizationSteps, setCustomizationSteps] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load the scenario data
  useEffect(() => {
    async function loadScenario() {
      try {
        const scenarioData = await fetchScenarioById(params.id as string);
        setScenario(scenarioData);
        
        // Initialize customization steps
        if (scenarioData.playerCustomizations) {
          const steps = Object.keys(scenarioData.playerCustomizations);
          setCustomizationSteps(steps);
          if (steps.length > 0) {
            setCurrentStep(steps[0]);
          }
        }
        
        // Initialize attributes with zero values
        if (scenarioData.attributes) {
          const initialAttributes: Record<string, number> = {};
          Object.keys(scenarioData.attributes).forEach(attr => {
            initialAttributes[attr] = 0;
          });
          setCharacterState(prev => ({
            ...prev,
            attributes: initialAttributes
          }));
        }
        
        // Initialize skills as all false
        if (scenarioData.baseSkills) {
          const initialSkills: Record<string, boolean> = {};
          Object.keys(scenarioData.baseSkills).forEach(skill => {
            initialSkills[skill] = false;
          });
          setCharacterState(prev => ({
            ...prev,
            skills: initialSkills
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading scenario:', error);
        setError('Failed to load scenario data. Please try again.');
        setLoading(false);
      }
    }

    loadScenario();
  }, [params.id]);

  // Handle selection of a customization option
  const handleCustomizationSelect = (option: string) => {
    if (!currentStep || !scenario?.playerCustomizations?.[currentStep]) return;
    
    // Update the customization selection
    setCharacterState(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [currentStep]: option
      }
    }));
    
    // Apply attribute bonuses
    const bonuses = scenario.playerCustomizations[currentStep].content[option].attributeBonus;
    
    setCharacterState(prev => {
      const updatedAttributes = { ...prev.attributes };
      
      // Apply bonuses to attributes
      Object.entries(bonuses).forEach(([attr, bonus]) => {
        updatedAttributes[attr] = (updatedAttributes[attr] || 0) + bonus;
      });
      
      // Update skills based on attributes
      const updatedSkills = { ...prev.skills };
      if (scenario.baseSkills) {
        Object.entries(scenario.baseSkills).forEach(([skillName, skillInfo]) => {
          // A skill is available if the associated attribute has a value of at least 1
          updatedSkills[skillName] = updatedAttributes[skillInfo.attribute] >= 1;
        });
      }
      
      return {
        ...prev,
        attributes: updatedAttributes,
        skills: updatedSkills
      };
    });
    
    // Move to the next customization step
    const currentIndex = customizationSteps.indexOf(currentStep);
    if (currentIndex < customizationSteps.length - 1) {
      setCurrentStep(customizationSteps[currentIndex + 1]);
    }
  };

  // Start the adventure
  const handleStartAdventure = async () => {
    // Ensure all customizations are selected
    const allCustomizationsSelected = customizationSteps.every(
      step => characterState.customizations[step]
    );
    
    if (!allCustomizationsSelected) {
      setError('Please complete all character customizations before starting.');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Store character state in localStorage for now
      // In a real implementation, this would be saved to a database
      const gameState = {
        id: `game_${Date.now()}`,
        user_id: user?.id || 'anonymous',
        scenario_id: params.id as string,
        character_data: {
          attributes: characterState.attributes,
          skills: characterState.skills,
          customizations: characterState.customizations
        },
        history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(`gameState_${params.id}`, JSON.stringify(gameState));
      
      // Navigate to the chat page
      router.push(`/scenarios/${params.id}/chat`);
    } catch (error) {
      console.error('Error creating character:', error);
      setError('Failed to create character. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const goBack = () => {
    if (!currentStep || customizationSteps.length === 0) return;
    
    const currentIndex = customizationSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(customizationSteps[currentIndex - 1]);
    } else {
      // If already at first step, go back to scenario page
      router.push(`/scenarios/${params.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Scenario Not Found</h1>
        <p className="text-gray-300 mb-8">The scenario you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center mb-6 space-x-4">
              <button
                onClick={goBack}
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-4xl font-bold text-white">Character Creation</h1>
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-800 text-red-100 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              {/* Progress Steps */}
              {customizationSteps.length > 0 && (
                <div className="flex items-center justify-center mb-8">
                  {customizationSteps.map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                        step === currentStep 
                          ? 'bg-purple-600 text-white' 
                          : characterState.customizations[step] 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-700 text-gray-400'
                      } border border-gray-600`}>
                        {index + 1}
                      </div>
                      {index < customizationSteps.length - 1 && (
                        <div className={`w-12 h-1 ${
                          index < customizationSteps.indexOf(currentStep!) 
                            ? 'bg-green-600' 
                            : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current Customization Step */}
              {currentStep && scenario.playerCustomizations && scenario.playerCustomizations[currentStep] && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-white">
                    {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}
                  </h2>
                  <p className="text-gray-300 text-lg">
                    {scenario.playerCustomizations[currentStep].description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {Object.entries(scenario.playerCustomizations[currentStep].content).map(([option, details]) => (
                      <button
                        key={option}
                        onClick={() => handleCustomizationSelect(option)}
                        className={`p-4 rounded-lg text-left transition-all ${
                          characterState.customizations[currentStep] === option
                            ? 'bg-purple-700 border-purple-500 shadow-lg'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        } border`}
                      >
                        <h3 className="font-semibold text-white mb-2">{option}</h3>
                        <p className="text-gray-300 text-sm mb-3">{details.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(details.attributeBonus).map(([attr, bonus]) => (
                            <span key={attr} className="bg-gray-800 px-2 py-1 rounded text-xs text-purple-300">
                              {attr} +{bonus}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Character Summary (shown when all customizations are selected) */}
              {customizationSteps.length > 0 && 
               customizationSteps.every(step => characterState.customizations[step]) && (
                <div className="mt-8 bg-gray-700/50 rounded-lg p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">Character Summary</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customizations */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Your Choices</h3>
                      <dl className="space-y-2">
                        {Object.entries(characterState.customizations).map(([category, choice]) => (
                          <div key={category} className="flex flex-col">
                            <dt className="text-gray-400 text-sm">{category.charAt(0).toUpperCase() + category.slice(1)}</dt>
                            <dd className="text-white">{choice}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    
                    {/* Attributes */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Attributes</h3>
                      <div className="space-y-3">
                        {Object.entries(characterState.attributes).map(([attr, value]) => (
                          <div key={attr} className="flex flex-col">
                            <div className="flex justify-between items-center">
                              <span className="text-white">{attr}</span>
                              <span className="text-purple-300 font-semibold">{value}</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                                style={{ width: `${Math.min(value * 10, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-2">Available Skills</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(characterState.skills)
                        .filter(([_, isAvailable]) => isAvailable)
                        .map(([skillName, _]) => (
                          <div key={skillName} className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
                            <span className="text-green-400 mr-2">✓</span>
                            <span className="text-white">{skillName}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Start Adventure Button */}
              <div className="mt-8">
                <button
                  onClick={handleStartAdventure}
                  disabled={isCreating || !customizationSteps.every(step => characterState.customizations[step])}
                  className="w-full text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg transform transition-all duration-300 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating Character...
                    </>
                  ) : (
                    'Start Adventure'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 