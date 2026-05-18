import type { Memory, MemoryRetrievalResult, MemoryCategory } from '../../../shared-types/memory.types';
import { memoryRepository } from '../storage/repositories/MemoryRepository';
import { memoryScorer } from './MemoryScorer';
import { logger } from '../../../src/shared/utils/logger';

export interface MemoryRetrievalOptions {
  query: string;
  categories?: MemoryCategory[];
  limit?: number;
  minRelevance?: number;
  includePinned?: boolean;
}

export class MemoryRetriever {
  async retrieveRelevantMemories(
    options: MemoryRetrievalOptions
  ): Promise<MemoryRetrievalResult[]> {
    const {
      query,
      categories,
      limit = 5,
      minRelevance = 0.4,
      includePinned = true,
    } = options;

    try {
      let memories = await this.fetchCandidateMemories(categories, includePinned);

      if (memories.length === 0) {
        return [];
      }

      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      const scoredMemories = memories.map(memory => {
        const semanticSimilarity = this.calculateSimpleSimilarity(queryLower, memory.content.toLowerCase());
        const scoringResult = memoryScorer.calculateCompositeScore(memory, semanticSimilarity);
        return scoringResult;
      });

      scoredMemories.sort((a, b) => b.compositeScore - a.compositeScore);

      const filtered = scoredMemories.filter(
        result => result.compositeScore >= minRelevance
      );

      const topResults = filtered.slice(0, limit);

      logger.debug('Memory retrieval completed', {
        query,
        totalCandidates: memories.length,
        retrieved: topResults.length,
        topScore: topResults[0]?.compositeScore,
      });

      return topResults;
    } catch (error) {
      logger.error('Memory retrieval failed', error as Error);
      return [];
    }
  }

  async retrieveByCategory(category: MemoryCategory, limit: number = 10): Promise<Memory[]> {
    try {
      const memories = await memoryRepository.findByCategory(category);
      return memories.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to retrieve memories by category: ${category}`, error as Error);
      return [];
    }
  }

  async retrieveRecentMemories(limit: number = 10): Promise<Memory[]> {
    try {
      const memories = await memoryRepository.findStrongestMemories(0.1, limit);
      return memories;
    } catch (error) {
      logger.error('Failed to retrieve recent memories', error as Error);
      return [];
    }
  }

  async retrievePinnedMemories(): Promise<Memory[]> {
    try {
      const allMemories = await memoryRepository.findMany({ isPinned: true });
      return allMemories;
    } catch (error) {
      logger.error('Failed to retrieve pinned memories', error as Error);
      return [];
    }
  }

  formatMemoriesForPrompt(memories: Memory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const formatted = memories.map((memory, index) => {
      const categoryLabel = this.getCategoryLabel(memory.category);
      return `${index + 1}. ${categoryLabel}: ${memory.content}`;
    }).join('\n');

    return `You remember these things:\n${formatted}`;
  }

  private async fetchCandidateMemories(
    categories?: MemoryCategory[],
    includePinned?: boolean
  ): Promise<Memory[]> {
    const query: Partial<Memory> = {};
    
    if (categories && categories.length > 0) {
      query.category = categories[0];
    }

    if (!includePinned) {
      query.isPinned = false;
    }

    const memories = await memoryRepository.findMany(query);
    
    const allMemories = includePinned 
      ? memories 
      : memories.filter(m => !m.isPinned);

    return allMemories.slice(0, 50);
  }

  private calculateSimpleSimilarity(query: string, content: string): number {
    const queryWords = this.tokenize(query);
    const contentWords = this.tokenize(content);

    if (queryWords.length === 0 || contentWords.length === 0) {
      return 0;
    }

    const querySet = new Set(queryWords);
    const contentSet = new Set(contentWords);

    let matchCount = 0;
    for (const word of querySet) {
      if (contentSet.has(word)) {
        matchCount++;
      }
      for (const contentWord of contentSet) {
        if (word.includes(contentWord) || contentWord.includes(word)) {
          matchCount += 0.5;
        }
      }
    }

    const maxPossibleMatches = querySet.size * 1.5;
    const similarity = matchCount / maxPossibleMatches;
    
    return Math.min(1, Math.max(0, similarity));
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private getCategoryLabel(category: MemoryCategory): string {
    const labels: Record<MemoryCategory, string> = {
      profile: 'Profile',
      emotional: 'Emotion',
      episodic: 'Event',
      relationship: 'Relationship',
      preference: 'Preference',
    };
    return labels[category] || 'Memory';
  }
}

export const memoryRetriever = new MemoryRetriever();
