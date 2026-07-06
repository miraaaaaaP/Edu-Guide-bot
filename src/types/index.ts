export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface LearningPath {
  topic: string;
  level: 'débutant' | 'intermédiaire' | 'avancé';
  modules: Module[];
  currentModule: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: string;
}

export interface UserProfile {
  name: string;
  level: string;
  interests: string[];
  completedTopics: string[];
  currentTopic?: string;
}

export type ChatState = 'idle' | 'loading' | 'streaming' | 'error';

export interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}
