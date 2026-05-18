import { ProviderHealth, AIGateway } from './AIGateway';

export interface HealthCheckResult {
  provider: string;
  isHealthy: boolean;
  latencyMs: number;
  lastCheck: Date;
  failureCount: number;
}

export class HealthChecker {
  private gateway: AIGateway;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(gateway: AIGateway, intervalMs: number = 60000) {
    this.gateway = gateway;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.checkAllProviders();
    this.checkInterval = setInterval(() => {
      this.checkAllProviders();
    }, this.intervalMs);

    console.log(`Health checker started with interval: ${this.intervalMs}ms`);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Health checker stopped');
    }
  }

  private async checkAllProviders(): Promise<void> {
    const healthStatuses = this.gateway.getHealthStatus();

    for (const health of healthStatuses) {
      try {
        const startTime = Date.now();
        const isAvailable = await this.checkProvider(health.name);
        const latencyMs = Date.now() - startTime;

        console.log(`Health check: ${health.name} - ${isAvailable ? 'OK' : 'FAILED'} (${latencyMs}ms)`);
      } catch (error) {
        console.error(`Health check failed for ${health.name}:`, error);
      }
    }
  }

  private async checkProvider(providerName: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const providerHealth = data.providers?.find(
        (p: ProviderHealth) => p.name === providerName
      );

      return providerHealth?.isHealthy ?? false;
    } catch {
      return false;
    }
  }

  getStatus(): HealthCheckResult[] {
    const healthStatuses = this.gateway.getHealthStatus();

    return healthStatuses.map(health => ({
      provider: health.name,
      isHealthy: health.isHealthy,
      latencyMs: health.avgLatencyMs,
      lastCheck: health.lastCheck,
      failureCount: health.failureCount,
    }));
  }
}
