export interface GameState {
  id: string;
  user_id: string;
  scenario_id: string;
  character_data: {
    attributes: Record<string, number>;
    skills: Record<string, boolean>;
    customizations: Record<string, string>;
    achievements?: Achievement[];
  };
  history: Array<GameMessage>;
  created_at: string;
  updated_at: string;
  conversationRound?: number;
  miniGamePlayed?: boolean;
  miniGameResult?: 'success' | 'failure';
}

export interface Achievement {
  title: string;
  description: string;
  attribute: string;
  amount: number;
  timestamp: string;
}

export interface GameMessage {
  message: string;
  sender: 'user' | 'system';
  timestamp: string;
  roll?: {
    value: number;
    attribute: string;
    modified_value: number;
  };
  reward?: {
    type: 'attribute' | 'achievement';
    attribute: string;
    amount: number;
    achievementTitle?: string;
  };
  miniGame?: {
    type: string;
    result: 'success' | 'failure';
  };
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  miniGame?: {
    type: string;
    component: 'TimingBar' | 'RhythmMatching';
  };
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  "Dnd-Scenario"?: string;
  attributes?: Record<string, string>;
  baseSkills?: Record<string, {
    attribute: string;
    description: string;
  }>;
  startingPoint?: string;
  playerCustomizations?: Record<string, {
    description: string;
    content: Record<string, {
      description: string;
      attributeBonus: Record<string, number>;
    }>;
  }>;
}

export interface SkillCheckResult {
  success: boolean;
  roll: number;
  difficulty: number;
  attribute: string;
  attributeValue: number;
  skillName: string;
  narrativeResult: string;
}

export interface CharacterCreationState {
  scenario_id: string;
  customizations: Record<string, string>;
  attributes: Record<string, number>;
  skills: Record<string, boolean>;
} 