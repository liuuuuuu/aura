import type { EmotionalSnapshot } from './personality.types';

export interface Memory {
  id: string;
  category: MemoryCategory;
  content: string;
  embedding: number[] | null;
  importanceScore: number;
  emotionalWeight: number;
  accessCount: number;
  lastAccessedAt: Date | null;
  decayRate: number;
  currentStrength: number;
  isPinned: boolean;
  emotionalContext: EmotionalSnapshot;
  userMood: string | null;
  relatedMemoryIds: string[];
  source: MemorySource;
  createdAt: Date;
  updatedAt: Date;
}

export type MemoryCategory = 
  | 'profile'
  | 'emotional'
  | 'episodic'
  | 'relationship'
  | 'preference';

export type MemorySource = 'conversation' | 'inference' | 'system';

export interface MemoryRetrievalResult {
  memory: Memory;
  compositeScore: number;
  semanticSimilarity: number;
  recencyScore: number;
}
