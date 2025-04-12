import fs from 'fs';
import path from 'path';

// Define types for the scenario structure
export interface Attribute {
  description: string;
}

export interface Skill {
  attribute: string;
  description: string;
}

export interface CustomizationOption {
  description: string;
  attributeBonus: Record<string, number>;
}

export interface CustomizationCategory {
  description: string;
  content: Record<string, CustomizationOption>;
}

export interface Scenario {
  'Dnd-Scenario': string;
  attributes: Record<string, string>;
  baseSkills: Record<string, Skill>;
  startingPoint: string;
  playerCustomizations: Record<string, CustomizationCategory>;
}

// Function to load all available scenarios
export async function getScenarioList(): Promise<string[]> {
  try {
    // In production, scenarios are in the public directory
    const scenariosDir = path.join(process.cwd(), 'public', 'scenarios');
    const files = fs.readdirSync(scenariosDir);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('Error loading scenario list:', error);
    return [];
  }
}

// Function to load a specific scenario by name
export async function getScenario(name: string): Promise<Scenario | null> {
  try {
    // In production, scenarios are in the public directory
    const scenarioPath = path.join(process.cwd(), 'public', 'scenarios', `${name}.json`);
    const fileContents = fs.readFileSync(scenarioPath, 'utf8');
    const scenario = JSON.parse(fileContents) as Scenario;
    return scenario;
  } catch (error) {
    console.error(`Error loading scenario ${name}:`, error);
    return null;
  }
}

// Function to initialize character attributes based on a scenario
export function initializeCharacter(
  scenario: Scenario, 
  customizationChoices: Record<string, string>
): {
  attributes: Record<string, number>;
  skills: Record<string, boolean>;
  customizations: Record<string, string>;
} {
  // Initialize base attributes to 10 (D&D-style base value)
  const attributes: Record<string, number> = {};
  Object.keys(scenario.attributes).forEach(attr => {
    attributes[attr] = 10;
  });
  
  // Apply attribute bonuses from customization choices
  Object.entries(customizationChoices).forEach(([category, choice]) => {
    const categoryOptions = scenario.playerCustomizations[category];
    if (categoryOptions && categoryOptions.content[choice]) {
      const bonuses = categoryOptions.content[choice].attributeBonus;
      Object.entries(bonuses).forEach(([attr, bonus]) => {
        attributes[attr] = (attributes[attr] || 10) + bonus;
      });
    }
  });
  
  // Initialize skills (all unlocked initially)
  const skills: Record<string, boolean> = {};
  Object.keys(scenario.baseSkills).forEach(skill => {
    skills[skill] = true;
  });
  
  return {
    attributes,
    skills,
    customizations: customizationChoices
  };
} 