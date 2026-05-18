import type { IProvider, CompletionRequest, CompletionResponse, StreamChunk } from './IProvider';
import { config } from '../../../../config/aura.config';
import { logger } from '../../../../src/shared/utils/logger';

export class ClaudeProvider implements IProvider {
  readonly name = 'claude' as const;
  readonly supportsStreaming = true;

  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = config.claude.apiKey;
    this.baseURL = config.claude.baseURL;
    this.model = config.claude.defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const systemMessage = request.systemPrompt 
      ? [{ role: 'user' as const, content: `<system>${request.systemPrompt}</system>` }]
      : [];

    const messages = [
      ...systemMessage,
      ...request.messages.map(m => ({ 
        role: m.role as 'user' | 'assistant', 
        content: m.content 
      })),
    ];

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
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
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.content?.[0]?.text || '',
      provider: this.name,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      latencyMs,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const systemMessage = request.systemPrompt 
      ? `Assistant: <system>${request.systemPrompt}</system>\n\n`
      : '';

    const conversationHistory = request.messages
      .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemMessage}${conversationHistory}\n\nAssistant:`;

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
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
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text || '';
              if (delta) {
                yield { delta, done: false };
              }
            }
            
            if (parsed.type === 'message_delta') {
              totalTokens = parsed.usage?.output_tokens || 0;
            }

            if (parsed.type === 'message_stop') {
              yield { delta: '', done: true, tokenCount: totalTokens };
              return;
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
