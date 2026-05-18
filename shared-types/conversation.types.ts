export interface Message {
  id: string;
  role: 'user' | 'aura';
  content: string;
  timestamp: Date;
  emotionalValence?: number;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  tokenCount?: number;
}

export interface CompletionRequest {
  messages: Message[];
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

export interface CompletionResponse {
  content: string;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
}
