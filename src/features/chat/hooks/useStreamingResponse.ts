import { useState, useCallback, useRef } from 'react';
import type { StreamChunk } from '@shared/conversation.types';

interface UseStreamingResponseOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useStreamingResponse(options: UseStreamingResponseOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');
  const fullContentRef = useRef('');

  const startStream = useCallback(async (messageId: string, conversationId: string) => {
    setIsStreaming(true);
    setContent('');
    fullContentRef.current = '';

    try {
      const response = await fetch(
        `http://localhost:3001/api/conversation/stream/${conversationId}/${messageId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.delta) {
                fullContentRef.current += data.delta;
                setContent(fullContentRef.current);
                options.onChunk?.({
                  delta: data.delta,
                  done: false,
                  tokenCount: data.tokenCount,
                });
              }

              if (data.done) {
                options.onComplete?.(fullContentRef.current);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      options.onError?.(error);
    } finally {
      setIsStreaming(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setContent('');
    fullContentRef.current = '';
  }, []);

  return {
    isStreaming,
    content,
    startStream,
    reset,
  };
}
