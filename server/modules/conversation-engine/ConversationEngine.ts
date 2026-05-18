import { aiGateway } from '../ai-gateway/AIGateway';
import { personalityEngine } from '../personality-engine/PersonalityEngine';
import { systemPromptAssembler } from '../prompt-engine/assemblers/SystemPromptAssembler';
import { conversationRepository } from '../storage/repositories/ConversationRepository';
import { memoryRepository } from '../storage/repositories/MemoryRepository';
import { StreamController } from './StreamController';
import { logger } from '../../../src/shared/utils/logger';
import type { Message } from '../../../shared-types/conversation.types';

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  messages: Message[];
  memories: any[];
}

export interface SendMessageOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export class ConversationEngine {
  private streamController: StreamController;

  constructor() {
    this.streamController = new StreamController();
  }

  async handleMessage(
    context: ConversationContext,
    userMessage: string,
    options: SendMessageOptions = {}
  ): Promise<{
    content: string;
    provider: string;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    personalityEngine.triggerEvent('session_start');

    await conversationRepository.addMessage(context.sessionId, {
      role: 'user',
      content: userMessage,
    });

    const emotionalValence = this.analyzeEmotionalValence(userMessage);
    if (emotionalValence > 0.3) {
      personalityEngine.triggerEvent('user_message_positive');
    } else if (emotionalValence < -0.3) {
      personalityEngine.triggerEvent('user_message_negative');
    }

    const conversationHistory = await conversationRepository.getConversationMessages(
      context.sessionId,
      50
    );

    const memories = await memoryRepository.findStrongestMemories(0.3, 5);

    const currentState = personalityEngine.getState();
    const assembledPrompt = systemPromptAssembler.assemblePrompt(
      currentState,
      memories,
      conversationHistory,
      context.userId
    );

    const request = {
      messages: conversationHistory.map(m => ({
        role: m.role === 'aura' ? 'assistant' : m.role,
        content: m.content,
      })),
      systemPrompt: assembledPrompt.systemPrompt,
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.8,
      stream: options.stream || false,
    };

    let response;
    try {
      response = await aiGateway.complete(request);
    } catch (error) {
      logger.error('AI Gateway failed', error as Error);
      throw new Error('Failed to get response from AI providers');
    }

    await conversationRepository.addMessage(context.sessionId, {
      role: 'aura',
      content: response.content,
      tokenCount: response.tokensUsed,
    });

    personalityEngine.triggerEvent('session_end');

    const latencyMs = Date.now() - startTime;
    logger.info('Message processed', {
      sessionId: context.sessionId,
      tokensUsed: response.tokensUsed,
      latencyMs,
      provider: response.provider,
    });

    return {
      content: response.content,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
      latencyMs,
    };
  }

  async *streamMessage(
    context: ConversationContext,
    userMessage: string,
    options: SendMessageOptions = {}
  ): AsyncGenerator<{
    delta: string;
    done: boolean;
    tokenCount?: number;
  }> {
    personalityEngine.triggerEvent('session_start');

    await conversationRepository.addMessage(context.sessionId, {
      role: 'user',
      content: userMessage,
    });

    const emotionalValence = this.analyzeEmotionalValence(userMessage);
    if (emotionalValence > 0.3) {
      personalityEngine.triggerEvent('user_message_positive');
    } else if (emotionalValence < -0.3) {
      personalityEngine.triggerEvent('user_message_negative');
    }

    const conversationHistory = await conversationRepository.getConversationMessages(
      context.sessionId,
      50
    );

    const memories = await memoryRepository.findStrongestMemories(0.3, 5);

    const currentState = personalityEngine.getState();
    const assembledPrompt = systemPromptAssembler.assemblePrompt(
      currentState,
      memories,
      conversationHistory,
      context.userId
    );

    const request = {
      messages: conversationHistory.map(m => ({
        role: m.role === 'aura' ? 'assistant' : m.role,
        content: m.content,
      })),
      systemPrompt: assembledPrompt.systemPrompt,
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.8,
      stream: true,
    };

    let fullContent = '';
    let totalTokens = 0;

    try {
      for await (const chunk of aiGateway.stream(request)) {
        fullContent += chunk.delta;
        totalTokens = chunk.tokenCount || totalTokens;

        const pacingDelay = this.streamController.calculatePacingDelay(
          chunk.delta,
          personalityEngine.getResponseModifiers()
        );

        if (pacingDelay > 0) {
          await this.sleep(pacingDelay);
        }

        yield {
          delta: chunk.delta,
          done: chunk.done,
          tokenCount: chunk.tokenCount,
        };

        if (chunk.done) {
          break;
        }
      }
    } catch (error) {
      logger.error('Stream failed', error as Error);
      throw new Error('Failed to stream response from AI providers');
    }

    await conversationRepository.addMessage(context.sessionId, {
      role: 'aura',
      content: fullContent,
      tokenCount: totalTokens,
    });

    personalityEngine.triggerEvent('session_end');
  }

  async getConversationHistory(sessionId: string, limit: number = 50): Promise<Message[]> {
    return conversationRepository.getConversationMessages(sessionId, limit);
  }

  private analyzeEmotionalValence(message: string): number {
    const positiveWords = ['happy', 'love', 'great', 'wonderful', 'amazing', 'good', 'nice', 'thank', 'grateful', 'excited', 'joy'];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'upset', 'frustrated', 'disappointed', 'annoyed'];

    const lowerMessage = message.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerMessage.includes(word)) {
        positiveCount++;
      }
    }

    for (const word of negativeWords) {
      if (lowerMessage.includes(word)) {
        negativeCount++;
      }
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const conversationEngine = new ConversationEngine();
