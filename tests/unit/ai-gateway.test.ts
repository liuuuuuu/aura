import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIGateway } from '../../server/modules/ai-gateway/AIGateway';

// Mock provider
const mockProvider = {
  name: 'test-provider',
  complete: vi.fn(),
  stream: vi.fn(),
  isHealthy: vi.fn(),
};

describe('AIGateway', () => {
  let aiGateway: AIGateway;

  beforeEach(() => {
    aiGateway = new AIGateway();
    vi.clearAllMocks();
    mockProvider.complete.mockResolvedValue({
      content: 'Test response',
      tokensUsed: 100,
      provider: 'test-provider',
      latencyMs: 500,
    });
    mockProvider.isHealthy.mockResolvedValue(true);
  });

  describe('provider registration', () => {
    it('should register a provider', () => {
      aiGateway.registerProvider(mockProvider as any);
      expect(aiGateway.getHealthStatus().length).toBe(1);
    });

    it('should set primary provider', () => {
      aiGateway.registerProvider(mockProvider as any);
      aiGateway.setPrimaryProvider('test-provider');
      expect(aiGateway.getHealthStatus()[0].name).toBe('test-provider');
    });

    it('should set fallback order', () => {
      aiGateway.registerProvider(mockProvider as any);
      aiGateway.setFallbackOrder(['test-provider']);
      expect(aiGateway.getHealthStatus()[0].name).toBe('test-provider');
    });
  });

  describe('completion', () => {
    it('should complete with registered provider', async () => {
      aiGateway.registerProvider(mockProvider as any);
      aiGateway.setPrimaryProvider('test-provider');

      const request = {
        messages: [{ role: 'user', content: 'Hello' }],
        systemPrompt: 'You are helpful',
        maxTokens: 100,
        temperature: 0.7,
        stream: false,
      };

      const response = await aiGateway.complete(request);
      expect(response.content).toBe('Test response');
      expect(response.provider).toBe('test-provider');
      expect(mockProvider.complete).toHaveBeenCalledWith(request);
    });
  });

  describe('health status', () => {
    it('should return health status for all providers', () => {
      aiGateway.registerProvider(mockProvider as any);
      const status = aiGateway.getHealthStatus();
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('test-provider');
    });
  });
});
