import type { 
  IProvider, 
  CompletionRequest, 
  CompletionResponse, 
  StreamChunk,
  ProviderName 
} from './providers/IProvider';
import { logger } from '../../src/shared/utils/logger';

export interface ProviderHealth {
  name: ProviderName;
  isHealthy: boolean;
  lastCheck: Date;
  failureCount: number;
  avgLatencyMs: number;
}

export class AIGateway {
  private providers: Map<ProviderName, IProvider>;
  private healthStatus: Map<ProviderName, ProviderHealth>;
  private primaryProvider: ProviderName;
  private fallbackOrder: ProviderName[];

  constructor() {
    this.providers = new Map();
    this.healthStatus = new Map();
    this.primaryProvider = 'openai';
    this.fallbackOrder = ['claude', 'deepseek', 'ollama'];
  }

  registerProvider(provider: IProvider): void {
    this.providers.set(provider.name, provider);
    this.healthStatus.set(provider.name, {
      name: provider.name,
      isHealthy: true,
      lastCheck: new Date(),
      failureCount: 0,
      avgLatencyMs: 0,
    });
    logger.info(`Provider registered: ${provider.name}`);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const providers = this.getProviderOrder();

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          logger.warn(`Provider ${providerName} is not available`);
          this.markProviderUnhealthy(providerName);
          continue;
        }

        const startTime = Date.now();
        const response = await provider.complete(request);
        const latencyMs = Date.now() - startTime;

        this.updateProviderHealth(providerName, true, latencyMs);
        logger.info(`Request completed by ${providerName} in ${latencyMs}ms`);

        return response;
      } catch (error) {
        logger.error(`Provider ${providerName} failed`, error as Error);
        this.markProviderUnhealthy(providerName);
      }
    }

    throw new Error('All AI providers failed');
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const providers = this.getProviderOrder();

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          logger.warn(`Provider ${providerName} is not available`);
          this.markProviderUnhealthy(providerName);
          continue;
        }

        if (!provider.supportsStreaming) {
          logger.warn(`Provider ${providerName} does not support streaming`);
          continue;
        }

        const startTime = Date.now();
        let totalTokens = 0;

        for await (const chunk of provider.stream(request)) {
          if (chunk.tokenCount) {
            totalTokens = chunk.tokenCount;
          }
          yield chunk;
        }

        const latencyMs = Date.now() - startTime;
        this.updateProviderHealth(providerName, true, latencyMs);
        logger.info(`Stream completed by ${providerName} in ${latencyMs}ms, tokens: ${totalTokens}`);

        return;
      } catch (error) {
        logger.error(`Provider ${providerName} stream failed`, error as Error);
        this.markProviderUnhealthy(providerName);
      }
    }

    throw new Error('All AI providers failed to stream');
  }

  private getProviderOrder(): ProviderName[] {
    const order: ProviderName[] = [this.primaryProvider];
    
    for (const provider of this.fallbackOrder) {
      if (provider !== this.primaryProvider) {
        order.push(provider);
      }
    }

    return order.filter(name => this.providers.has(name));
  }

  private markProviderUnhealthy(providerName: ProviderName): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.failureCount++;
      health.isHealthy = health.failureCount < 3;
    }
  }

  private updateProviderHealth(providerName: ProviderName, success: boolean, latencyMs: number): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.lastCheck = new Date();
      health.failureCount = success ? 0 : health.failureCount + 1;
      health.isHealthy = health.failureCount < 3;
      health.avgLatencyMs = (health.avgLatencyMs * 0.8 + latencyMs * 0.2);
    }
  }

  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }

  setPrimaryProvider(providerName: ProviderName): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} is not registered`);
    }
    this.primaryProvider = providerName;
    logger.info(`Primary provider set to: ${providerName}`);
  }

  setFallbackOrder(order: ProviderName[]): void {
    this.fallbackOrder = order;
    logger.info(`Fallback order updated: ${order.join(' -> ')}`);
  }
}

export const aiGateway = new AIGateway();
