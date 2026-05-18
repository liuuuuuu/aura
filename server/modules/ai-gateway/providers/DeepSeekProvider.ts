import type { IProvider, CompletionRequest, CompletionResponse, StreamChunk } from './IProvider';
import { config } from '../../../../config/aura.config';
import { logger } from '../../../../src/shared/utils/logger';

export class DeepSeekProvider implements IProvider {
  readonly name = 'deepseek' as const;
  readonly supportsStreaming = true;

  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = config.deepseek.apiKey;
    this.baseURL = config.deepseek.baseURL;
    this.model = config.deepseek.defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const messages = [
      { role: 'system', content: request.systemPrompt },
      ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: this.name,
      tokensUsed: data.usage?.total_tokens || 0,
      latencyMs,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const messages = [
      { role: 'system', content: request.systemPrompt },
      ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            yield { delta: '', done: true, tokenCount: totalTokens };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            totalTokens = parsed.usage?.total_tokens || totalTokens;

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
