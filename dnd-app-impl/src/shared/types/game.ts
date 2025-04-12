export interface GameState {
  id: string;
  user_id: string;
  scenario_id: string;
  character_data: {
    attributes: Record<string, number>;
    skills: Record<string, boolean>;
    customizations: Record<string, string>;
  };
  history: Array<GameMessage>;
  created_at: string;
  updated_at: string;
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
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
} 