import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryEngine } from '../../server/modules/memory-engine/MemoryEngine';

// Mock dependencies
vi.mock('../../server/modules/storage/repositories/MemoryRepository', () => ({
  memoryRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findStrongestMemories: vi.fn(),
  },
}));

vi.mock('../../server/modules/memory-engine/MemoryExtractor', () => ({
  memoryExtractor: {
    extractMemories: vi.fn(),
  },
}));

vi.mock('../../server/modules/memory-engine/MemoryRetriever', () => ({
  memoryRetriever: {
    retrieveRelevantMemories: vi.fn(),
    retrieveByCategory: vi.fn(),
    retrieveRecentMemories: vi.fn(),
    retrievePinnedMemories: vi.fn(),
  },
}));

vi.mock('../../server/modules/memory-engine/MemoryScorer', () => ({
  memoryScorer: {
    getDecayRateForCategory: vi.fn(),
  },
}));

vi.mock('../../server/modules/memory-engine/MemoryDecayWorker', () => ({
  memoryDecayWorker: {
    start: vi.fn(),
    stop: vi.fn(),
    runDecayCycle: vi.fn(),
  },
}));

vi.mock('../../src/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MemoryEngine', () => {
  let memoryEngine: MemoryEngine;

  beforeEach(() => {
    memoryEngine = new MemoryEngine();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(memoryEngine).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customEngine = new MemoryEngine({
        enableAutoExtraction: false,
      });
      expect(customEngine.getConfig().enableAutoExtraction).toBe(false);
    });
  });

  describe('config management', () => {
    it('should return current config', () => {
      const config = memoryEngine.getConfig();
      expect(config).toHaveProperty('enableAutoExtraction');
      expect(config).toHaveProperty('extractionThreshold');
      expect(config).toHaveProperty('retrievalLimit');
      expect(config).toHaveProperty('autoDecay');
    });

    it('should update config', () => {
      memoryEngine.updateConfig({ retrievalLimit: 10 });
      expect(memoryEngine.getConfig().retrievalLimit).toBe(10);
    });
  });

  describe('context formatting', () => {
    it('should return empty string for no memories', () => {
      const context = memoryEngine.formatContextForPrompt([]);
      expect(context).toBe('');
    });

    it('should format memories with emojis and strength indicators', () => {
      const memories = [
        {
          id: '1',
          category: 'profile',
          content: 'User likes cats',
          embedding: null,
          importanceScore: 0.8,
          emotionalWeight: 0.6,
          accessCount: 5,
          lastAccessedAt: null,
          decayRate: 0.01,
          currentStrength: 0.9,
          isPinned: false,
          emotionalContext: {},
          userMood: null,
          relatedMemoryIds: [],
          source: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const context = memoryEngine.formatContextForPrompt(memories as any);
      expect(context).toContain('User likes cats');
      expect(context).toContain('👤');
    });
  });
});
