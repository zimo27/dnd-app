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
  // Add state for tracking free points
  const [freePoints, setFreePoints] = useState(5);
  const [baseAttributes, setBaseAttributes] = useState<Record<string, number>>({});

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
          // Store the base attributes separately to track customization bonuses
          setBaseAttributes(initialAttributes);
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
    
    // Calculate difference in attribute bonuses when changing selection
    const newBonuses = scenario.playerCustomizations[currentStep].content[option].attributeBonus;
    const prevOption = characterState.customizations[currentStep];
    const prevBonuses = prevOption ? 
      scenario.playerCustomizations[currentStep].content[prevOption].attributeBonus : {};
    
    // Update the customization selection
    setCharacterState(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [currentStep]: option
      }
    }));
    
    // Apply attribute bonuses
    setCharacterState(prev => {
      const updatedAttributes = { ...prev.attributes };
      
      // Remove previous bonuses if there were any
      if (prevOption) {
        Object.entries(prevBonuses).forEach(([attr, bonus]) => {
          updatedAttributes[attr] = (updatedAttributes[attr] || 0) - bonus;
        });
      }
      
      // Apply new bonuses
      Object.entries(newBonuses).forEach(([attr, bonus]) => {
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
    } else {
      // If all steps are complete, set currentStep to null to show attribute allocation
      setCurrentStep(null);
    }
  };

  // Handle incrementing an attribute using free points
  const handleIncrementAttribute = (attr: string) => {
    if (freePoints <= 0) return;
    
    setFreePoints(prev => prev - 1);
    setCharacterState(prev => {
      const updatedAttributes = { ...prev.attributes };
      updatedAttributes[attr] = (updatedAttributes[attr] || 0) + 1;
      
      // Update skills based on new attribute value
      const updatedSkills = { ...prev.skills };
      if (scenario?.baseSkills) {
        // Only update skills linked to this specific attribute
        Object.entries(scenario.baseSkills)
          .filter(([_, skillInfo]) => skillInfo.attribute === attr)
          .forEach(([skillName, _]) => {
            updatedSkills[skillName] = updatedAttributes[attr] >= 1;
          });
      }
      
      return {
        ...prev,
        attributes: updatedAttributes,
        skills: updatedSkills
      };
    });
  };

  // Handle decrementing an attribute to regain free points
  const handleDecrementAttribute = (attr: string) => {
    // Calculate base + custom points (excluding free points)
    const baseValue = baseAttributes[attr] || 0;
    const fromCustomizations = calculateCustomizationBonus(attr);
    const attrTotal = characterState.attributes[attr] || 0;
    const allocatedFreePoints = Math.max(0, attrTotal - baseValue - fromCustomizations);
    
    // Only allow decrementing if there are allocated free points
    if (allocatedFreePoints <= 0) return;
    
    setFreePoints(prev => prev + 1);
    setCharacterState(prev => {
      const updatedAttributes = { ...prev.attributes };
      updatedAttributes[attr] = (updatedAttributes[attr] || 0) - 1;
      
      // Update skills based on new attribute value
      const updatedSkills = { ...prev.skills };
      if (scenario?.baseSkills) {
        // Only update skills linked to this specific attribute
        Object.entries(scenario.baseSkills)
          .filter(([_, skillInfo]) => skillInfo.attribute === attr)
          .forEach(([skillName, _]) => {
            updatedSkills[skillName] = updatedAttributes[attr] >= 1;
          });
      }
      
      return {
        ...prev,
        attributes: updatedAttributes,
        skills: updatedSkills
      };
    });
  };
  
  // Calculate how much of an attribute comes from customization choices
  const calculateCustomizationBonus = (attr: string): number => {
    if (!scenario?.playerCustomizations) return 0;
    
    let bonus = 0;
    Object.entries(characterState.customizations).forEach(([customStep, selectedOption]) => {
      if (scenario.playerCustomizations?.[customStep]?.content?.[selectedOption]?.attributeBonus?.[attr]) {
        bonus += scenario.playerCustomizations[customStep].content[selectedOption].attributeBonus[attr];
      }
    });
    
    return bonus;
  };
  
  // Calculate how much of an attribute comes from free points
  const getFreePointsAllocated = (attr: string): number => {
    const baseValue = baseAttributes[attr] || 0;
    const fromCustomizations = calculateCustomizationBonus(attr);
    const attrTotal = characterState.attributes[attr] || 0;
    return Math.max(0, attrTotal - baseValue - fromCustomizations);
  };

  // Handle attribute adjustment using the slider
  const handleAttributeSlider = (attr: string, value: number) => {
    // Calculate base + custom points (excluding free points)
    const baseValue = baseAttributes[attr] || 0;
    const fromCustomizations = calculateCustomizationBonus(attr);
    const currentFreePoints = getFreePointsAllocated(attr);
    
    // Calculate the change in points
    const targetValue = baseValue + fromCustomizations + value;
    const pointDifference = value - currentFreePoints;
    
    // Check if we have enough free points
    if (freePoints < pointDifference) return;
    
    // Update free points
    setFreePoints(prev => prev - pointDifference);
    
    // Update attribute value for ONLY this specific attribute, preserving others
    setCharacterState(prev => {
      const updatedAttributes = { ...prev.attributes };
      updatedAttributes[attr] = targetValue;
      
      // Update skills based on new attribute value
      const updatedSkills = { ...prev.skills };
      if (scenario?.baseSkills) {
        // Only update skills linked to this specific attribute
        Object.entries(scenario.baseSkills)
          .filter(([_, skillInfo]) => skillInfo.attribute === attr)
          .forEach(([skillName, _]) => {
            updatedSkills[skillName] = updatedAttributes[attr] >= 1;
          });
      }
      
      return {
        ...prev,
        attributes: updatedAttributes,
        skills: updatedSkills
      };
    });
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
    if (customizationSteps.length === 0) {
      router.push(`/scenarios/${params.id}`);
      return;
    }

    // If currentStep is null (we're at attribute allocation screen) and there are customization steps,
    // go back to the last customization step
    if (!currentStep && customizationSteps.length > 0) {
      setCurrentStep(customizationSteps[customizationSteps.length - 1]);
      return;
    }
    
    if (!currentStep) return;
    
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
              
              {/* Current Customization Step - Only shown if we're on a customization step */}
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
              
              {/* Content shown after all customizations are selected */}
              {customizationSteps.length > 0 && 
               customizationSteps.every(step => characterState.customizations[step]) && 
               !currentStep && (
                <>
                  {/* Free Attribute Points Allocation */}
                  <div className="mt-8 bg-gray-700/50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-white">Allocate Attribute Points</h2>
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                        <span>{freePoints}</span> points remaining
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {Object.entries(characterState.attributes).map(([attr, value]) => {
                        const baseValue = baseAttributes[attr] || 0;
                        const fromCustomizations = calculateCustomizationBonus(attr);
                        const fromFreePoints = Math.max(0, value - baseValue - fromCustomizations);
                        const maxPoints = freePoints + fromFreePoints;
                        
                        return (
                          <div key={attr} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-white font-medium">{attr}</span>
                                <div className="text-xs text-gray-400 mt-1">
                                  Base: {baseValue + fromCustomizations} + Allocated: {fromFreePoints}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleDecrementAttribute(attr)}
                                  className="w-8 h-8 rounded-l bg-gray-700 text-white font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                                  disabled={fromFreePoints <= 0}
                                >
                                  -
                                </button>
                                <div className="w-12 h-8 bg-gray-600 flex items-center justify-center text-white">
                                  {value}
                                </div>
                                <button
                                  onClick={() => handleIncrementAttribute(attr)}
                                  className="w-8 h-8 rounded-r bg-gray-700 text-white font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                                  disabled={freePoints <= 0}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400">Free Points Allocation</span>
                                <span className="text-xs text-purple-400">{fromFreePoints} / {maxPoints}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={maxPoints}
                                value={fromFreePoints}
                                onChange={(e) => handleAttributeSlider(attr, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0</span>
                                <span>{maxPoints}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Character Summary */}
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
                          {Object.entries(characterState.attributes).map(([attr, value]) => {
                            // Calculate the different components of the attribute
                            const baseValue = baseAttributes[attr] || 0;
                            const fromCustomizations = calculateCustomizationBonus(attr);
                            const fromFreePoints = getFreePointsAllocated(attr);
                            
                            return (
                              <div key={attr} className="flex flex-col">
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{attr}</span>
                                  <div>
                                    <span className="text-purple-300 font-semibold">{value}</span>
                                    {fromFreePoints > 0 && (
                                      <span className="text-xs text-green-400 ml-1">(+{fromFreePoints})</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Visual representation of attribute composition */}
                                <div className="w-full bg-gray-600 rounded-full h-2 mt-1 overflow-hidden">
                                  {/* Base attribute bar */}
                                  <div
                                    className="bg-gray-400 h-2 rounded-full"
                                    style={{ width: `${Math.min(baseValue * 10, 100)}%` }}
                                  />
                                  
                                  {/* Customization bonus bar layered on top */}
                                  <div
                                    className="bg-blue-500 h-2 rounded-full -mt-2"
                                    style={{ 
                                      width: `${Math.min((baseValue + fromCustomizations) * 10, 100)}%`,
                                      opacity: fromCustomizations > 0 ? 1 : 0
                                    }}
                                  />
                                  
                                  {/* Free points bar layered on top */}
                                  <div
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full -mt-2"
                                    style={{ 
                                      width: `${Math.min(value * 10, 100)}%`,
                                      opacity: fromFreePoints > 0 ? 1 : 0
                                    }}
                                  />
                                </div>
                                
                                {/* Legend for the attribute composition */}
                                <div className="flex text-xs mt-1 space-x-2 text-gray-400">
                                  {baseValue > 0 && (
                                    <span className="flex items-center">
                                      <span className="h-2 w-2 bg-gray-400 rounded-full inline-block mr-1"></span>
                                      Base: {baseValue}
                                    </span>
                                  )}
                                  {fromCustomizations > 0 && (
                                    <span className="flex items-center">
                                      <span className="h-2 w-2 bg-blue-500 rounded-full inline-block mr-1"></span>
                                      Class: +{fromCustomizations}
                                    </span>
                                  )}
                                  {fromFreePoints > 0 && (
                                    <span className="flex items-center">
                                      <span className="h-2 w-2 bg-purple-500 rounded-full inline-block mr-1"></span>
                                      Free: +{fromFreePoints}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
                </>
              )}
              
              {/* Character Summary - Shown when in a customization step but after some customizations are selected */}
              {currentStep && customizationSteps.some(step => characterState.customizations[step]) && (
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
                        {Object.entries(characterState.attributes).map(([attr, value]) => {
                          // Calculate the different components of the attribute
                          const baseValue = baseAttributes[attr] || 0;
                          const fromCustomizations = calculateCustomizationBonus(attr);
                          const fromFreePoints = getFreePointsAllocated(attr);
                          
                          return (
                          <div key={attr} className="flex flex-col">
                            <div className="flex justify-between items-center">
                              <span className="text-white">{attr}</span>
                                <div>
                              <span className="text-purple-300 font-semibold">{value}</span>
                                  {fromFreePoints > 0 && (
                                    <span className="text-xs text-green-400 ml-1">(+{fromFreePoints})</span>
                                  )}
                                </div>
                            </div>
                              
                              {/* Visual representation of attribute composition */}
                              <div className="w-full bg-gray-600 rounded-full h-2 mt-1 overflow-hidden">
                                {/* Base attribute bar */}
                                <div
                                  className="bg-gray-400 h-2 rounded-full"
                                  style={{ width: `${Math.min(baseValue * 10, 100)}%` }}
                                />
                                
                                {/* Customization bonus bar layered on top */}
                                <div
                                  className="bg-blue-500 h-2 rounded-full -mt-2"
                                  style={{ 
                                    width: `${Math.min((baseValue + fromCustomizations) * 10, 100)}%`,
                                    opacity: fromCustomizations > 0 ? 1 : 0
                                  }}
                                />
                                
                                {/* Free points bar layered on top */}
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full -mt-2"
                                  style={{ 
                                    width: `${Math.min(value * 10, 100)}%`,
                                    opacity: fromFreePoints > 0 ? 1 : 0
                                  }}
                                />
                              </div>
                              
                              {/* Legend for the attribute composition */}
                              <div className="flex text-xs mt-1 space-x-2 text-gray-400">
                                {baseValue > 0 && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full inline-block mr-1"></span>
                                    Base: {baseValue}
                                  </span>
                                )}
                                {fromCustomizations > 0 && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full inline-block mr-1"></span>
                                    Class: +{fromCustomizations}
                                  </span>
                                )}
                                {fromFreePoints > 0 && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 bg-purple-500 rounded-full inline-block mr-1"></span>
                                    Free: +{fromFreePoints}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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