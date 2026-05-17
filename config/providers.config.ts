export const providerConfig = {
  providers: [
    {
      name: 'openai' as const,
      priority: 1,
      enabled: true,
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      supportsStreaming: true,
      supportsFunctions: true,
    },
    {
      name: 'claude' as const,
      priority: 2,
      enabled: true,
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
      supportsStreaming: true,
      supportsFunctions: true,
    },
    {
      name: 'deepseek' as const,
      priority: 3,
      enabled: true,
      models: ['deepseek-chat'],
      supportsStreaming: true,
      supportsFunctions: false,
    },
    {
      name: 'ollama' as const,
      priority: 4,
      enabled: true,
      models: ['llama2', 'mistral', 'codellama'],
      supportsStreaming: true,
      supportsFunctions: false,
    },
  ],
  fallback: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
  },
  healthCheck: {
    interval: 60000,
    failureThreshold: 3,
  },
};

export type ProviderName = 'openai' | 'claude' | 'deepseek' | 'ollama';
