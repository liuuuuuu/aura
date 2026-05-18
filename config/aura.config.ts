export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    embeddingModel: 'text-embedding-3-small',
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    baseURL: process.env.CLAUDE_API_BASE || 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  ollama: {
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    defaultModel: process.env.OLLAMA_MODEL || 'llama2',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    path: process.env.DB_PATH || './data/aura.db',
  },
};

export type Config = typeof config;
