import { memoryRepository } from '../storage/repositories/MemoryRepository';
import { memoryExtractor } from './MemoryExtractor';
import { memoryRetriever } from './MemoryRetriever';
import { memoryScorer } from './MemoryScorer';
import { memoryDecayWorker } from './MemoryDecayWorker';
import type { Memory, MemoryRetrievalResult, MemoryCategory, EmotionalSnapshot } from '../../../shared-types/memory.types';
import type { Message } from '../../../shared-types/conversation.types';
import { logger } from '../../../src/shared/utils/logger';

export interface MemoryEngineConfig {
  enableAutoExtraction: boolean;
  extractionThreshold: number;
  retrievalLimit: number;
  autoDecay: boolean;
}

const DEFAULT_CONFIG: MemoryEngineConfig = {
  enableAutoExtraction: true,
  extractionThreshold: 0.3,
  retrievalLimit: 5,
  autoDecay: true,
};

export class MemoryEngine {
  private config: MemoryEngineConfig;

  constructor(config?: Partial<MemoryEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.config.autoDecay) {
      memoryDecayWorker.start();
      logger.info('Memory engine initialized with auto-decay enabled');
    } else {
      logger.info('Memory engine initialized with auto-decay disabled');
    }
  }

  async shutdown(): Promise<void> {
    memoryDecayWorker.stop();
    logger.info('Memory engine shut down');
  }

  async extractAndStoreMemories(
    messages: Message[],
    emotionalState: EmotionalSnapshot
  ): Promise<Memory[]> {
    if (!this.config.enableAutoExtraction) {
      return [];
    }

    if (messages.length < 3) {
      return [];
    }

    const extractedMemories = await memoryExtractor.extractMemories(
      messages,
      emotionalState
    );

    const significantMemories = extractedMemories.filter(
      m => m.importanceScore >= this.config.extractionThreshold
    );

    logger.info(`Extracted ${significantMemories.length} significant memories from ${messages.length} messages`);

    return significantMemories;
  }

  async retrieveContext(
    query: string,
    categories?: MemoryCategory[]
  ): Promise<MemoryRetrievalResult[]> {
    const results = await memoryRetriever.retrieveRelevantMemories({
      query,
      categories,
      limit: this.config.retrievalLimit,
      minRelevance: 0.4,
    });

    return results;
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    return memoryRepository.findById(id);
  }

  async getMemoriesByCategory(category: MemoryCategory): Promise<Memory[]> {
    return memoryRetriever.retrieveByCategory(category);
  }

  async getRecentMemories(limit: number = 10): Promise<Memory[]> {
    return memoryRetriever.retrieveRecentMemories(limit);
  }

  async getPinnedMemories(): Promise<Memory[]> {
    return memoryRetriever.retrievePinnedMemories();
  }

  async createMemory(
    content: string,
    category: MemoryCategory,
    emotionalState: EmotionalSnapshot,
    options?: {
      importanceScore?: number;
      emotionalWeight?: number;
      isPinned?: boolean;
    }
  ): Promise<Memory> {
    const memory = await memoryRepository.create({
      category,
      content,
      embedding: null,
      importanceScore: options?.importanceScore ?? 0.5,
      emotionalWeight: options?.emotionalWeight ?? 0.5,
      accessCount: 0,
      lastAccessedAt: null,
      decayRate: memoryScorer.getDecayRateForCategory(category),
      currentStrength: 1.0,
      isPinned: options?.isPinned ?? false,
      emotionalContext: emotionalState,
      userMood: null,
      relatedMemoryIds: [],
      source: 'system',
    });

    logger.info(`Memory created: ${memory.id} (${category})`);
    return memory;
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    const memory = await memoryRepository.update(id, updates);
    if (memory) {
      logger.debug(`Memory updated: ${id}`, updates);
    }
    return memory;
  }

  async deleteMemory(id: string): Promise<void> {
    await memoryRepository.delete(id);
    logger.info(`Memory deleted: ${id}`);
  }

  async pinMemory(id: string): Promise<Memory | null> {
    return this.updateMemory(id, { isPinned: true });
  }

  async unpinMemory(id: string): Promise<Memory | null> {
    return this.updateMemory(id, { isPinned: false });
  }

  async boostMemory(id: string, boostAmount: number = 0.2): Promise<Memory | null> {
    const memory = await memoryRepository.findById(id);
    if (!memory) return null;

    const newStrength = Math.min(1, memory.currentStrength + boostAmount);
    return this.updateMemory(id, { currentStrength: newStrength });
  }

  async runDecayCycle(): Promise<{
    processedCount: number;
    archivedCount: number;
    updatedCount: number;
  }> {
    return memoryDecayWorker.runDecayCycle();
  }

  formatContextForPrompt(memories: Memory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const formatted = memories.map((memory, index) => {
      const emoji = this.getCategoryEmoji(memory.category);
      const strengthIndicator = this.getStrengthIndicator(memory.currentStrength);
      return `${index + 1}. ${emoji} ${memory.content} ${strengthIndicator}`;
    }).join('\n');

    return `You remember these things:\n${formatted}`;
  }

  private getCategoryEmoji(category: MemoryCategory): string {
    const emojis: Record<MemoryCategory, string> = {
      profile: '👤',
      emotional: '💭',
      episodic: '📖',
      relationship: '💕',
      preference: '⭐',
    };
    return emojis[category] || '📝';
  }

  private getStrengthIndicator(strength: number): string {
    if (strength > 0.8) return '(vivid)';
    if (strength > 0.5) return '(clear)';
    if (strength > 0.2) return '(fading)';
    return '(vague)';
  }

  getConfig(): MemoryEngineConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MemoryEngineConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Memory engine config updated', { config: this.config });
  }
}

export const memoryEngine = new MemoryEngine();
