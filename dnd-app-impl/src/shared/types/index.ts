// Scenario structure types
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

// Game state types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface GameState {
  id: string;
  user_id: string;
  scenario_id: string;
  character_data: CharacterData;
  history: GameHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface CharacterData {
  attributes: Record<string, number>;
  skills: Record<string, boolean>;
  customizations: Record<string, string>;
}

export interface GameHistoryEntry {
  message: string;
  sender: 'user' | 'system';
  timestamp: string;
  roll?: DiceRoll;
}

export interface DiceRoll {
  value: number;
  attribute: string;
  modified_value: number;
} 