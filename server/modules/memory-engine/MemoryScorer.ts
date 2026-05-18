import type { Memory, MemoryRetrievalResult } from '../../../shared-types/memory.types';
import { logger } from '../../../src/shared/utils/logger';

export interface MemoryScorerConfig {
  semanticWeight: number;
  importanceWeight: number;
  emotionalWeight: number;
  recencyWeight: number;
  accessFrequencyWeight: number;
  decayConstant: number;
}

const DEFAULT_SCORER_CONFIG: MemoryScorerConfig = {
  semanticWeight: 0.40,
  importanceWeight: 0.25,
  emotionalWeight: 0.20,
  recencyWeight: 0.10,
  accessFrequencyWeight: 0.05,
  decayConstant: 0.01,
};

export class MemoryScorer {
  private config: MemoryScorerConfig;

  constructor(config?: Partial<MemoryScorerConfig>) {
    this.config = { ...DEFAULT_SCORER_CONFIG, ...config };
  }

  calculateCompositeScore(
    memory: Memory,
    semanticSimilarity: number = 0.5,
    currentTime: Date = new Date()
  ): MemoryRetrievalResult {
    const recencyScore = this.calculateRecencyScore(memory, currentTime);
    const accessFrequencyScore = this.calculateAccessFrequencyScore(memory);
    
    const compositeScore = 
      (semanticSimilarity * this.config.semanticWeight) +
      (memory.importanceScore * this.config.importanceWeight) +
      (memory.emotionalWeight * this.config.emotionalWeight) +
      (recencyScore * this.config.recencyWeight) +
      (accessFrequencyScore * this.config.accessFrequencyWeight);

    return {
      memory,
      compositeScore: Math.min(1, Math.max(0, compositeScore)),
      semanticSimilarity,
      recencyScore,
    };
  }

  calculateRecencyScore(memory: Memory, currentTime: Date = new Date()): number {
    if (!memory.createdAt) {
      return 0;
    }

    const daysSinceCreation = (currentTime.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const lambda = memory.decayRate || this.config.decayConstant;
    
    const recencyScore = Math.exp(-lambda * daysSinceCreation);
    return Math.min(1, Math.max(0, recencyScore));
  }

  calculateAccessFrequencyScore(memory: Memory): number {
    const maxAccessCount = 10;
    const normalizedAccess = Math.min(memory.accessCount, maxAccessCount) / maxAccessCount;
    return normalizedAccess;
  }

  calculateCurrentStrength(memory: Memory, currentTime: Date = new Date()): number {
    const recencyScore = this.calculateRecencyScore(memory, currentTime);
    const strengthBoost = memory.accessCount * 0.1;
    
    const currentStrength = Math.min(1, recencyScore * memory.importanceScore + strengthBoost);
    return Math.max(0, currentStrength);
  }

  rankMemories(
    candidates: Array<{ memory: Memory; semanticSimilarity?: number }>,
    currentTime: Date = new Date(),
    topK: number = 5
  ): MemoryRetrievalResult[] {
    const scored = candidates.map(candidate => {
      return this.calculateCompositeScore(
        candidate.memory,
        candidate.semanticSimilarity ?? 0.5,
        currentTime
      );
    });

    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const threshold = 0.4;
    const filtered = scored.filter(result => result.compositeScore >= threshold);

    return filtered.slice(0, topK);
  }

  shouldArchiveMemory(memory: Memory, threshold: number = 0.05): boolean {
    const currentStrength = this.calculateCurrentStrength(memory);
    return currentStrength < threshold && !memory.isPinned;
  }

  getDecayRateForCategory(category: string): number {
    const decayRates: Record<string, number> = {
      profile: 0.001,
      emotional: 0.005,
      episodic: 0.02,
      relationship: 0.003,
      preference: 0.01,
    };
    return decayRates[category] || 0.01;
  }

  updateConfig(config: Partial<MemoryScorerConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('MemoryScorer config updated', { config: this.config });
  }
}

export const memoryScorer = new MemoryScorer();
