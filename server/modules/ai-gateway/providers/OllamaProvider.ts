import type { IProvider, CompletionRequest, CompletionResponse, StreamChunk } from './providers/IProvider';
import { config } from '../../../config/aura.config';
import { logger } from '../../../src/shared/utils/logger';

export class OllamaProvider implements IProvider {
  readonly name = 'ollama' as const;
  readonly supportsStreaming = true;

  private baseURL: string;
  private model: string;

  constructor() {
    this.baseURL = config.ollama.baseURL;
    this.model = config.ollama.defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const systemPrompt = request.systemPrompt;
    const conversationHistory = request.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\n${conversationHistory}\n\nAssistant:`;

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.response || '',
      provider: this.name,
      tokensUsed: data.eval_count || 0,
      latencyMs,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const systemPrompt = request.systemPrompt;
    const conversationHistory = request.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\n${conversationHistory}\n\nAssistant:`;

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            const delta = parsed.response || '';
            totalTokens = parsed.eval_count || totalTokens;

            if (delta) {
              yield { delta, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { delta: '', done: true, tokenCount: totalTokens };
  }
}
