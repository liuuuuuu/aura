import { useState, useCallback } from 'react';
import type { Message } from '@shared/conversation.types';
import { v4 as uuidv4 } from 'uuid';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((role: 'user' | 'aura', content: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage = addMessage('user', content);

    try {
      const response = await fetch('http://localhost:3001/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      addMessage('aura', data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      addMessage('aura', 'I apologize, but I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, addMessage]);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    updateMessage,
    clearMessages,
    sendMessage,
  };
}
