export interface StreamChunk {
  delta: string;
  done: boolean;
  tokenCount?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

export interface CompletionResponse {
  content: string;
  provider: ProviderName;
  tokensUsed: number;
  latencyMs: number;
}

export interface IProvider {
  readonly name: ProviderName;
  readonly supportsStreaming: boolean;
  readonly isAvailable: () => Promise<boolean>;
  
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;
}

export type ProviderName = 'openai' | 'claude' | 'deepseek' | 'ollama';
