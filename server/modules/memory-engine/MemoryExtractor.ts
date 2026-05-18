import { z } from 'zod';
import type { Memory, MemoryCategory, EmotionalSnapshot } from '../../../shared-types/memory.types';
import { aiGateway } from '../ai-gateway/AIGateway';
import { memoryRepository } from '../storage/repositories/MemoryRepository';
import { logger } from '../../../src/shared/utils/logger';
import type { Message } from '../../../shared-types/conversation.types';

const MemoryExtractionSchema = z.object({
  memories: z.array(z.object({
    category: z.enum(['profile', 'emotional', 'episodic', 'relationship', 'preference']),
    content: z.string(),
    importanceScore: z.number().min(0).max(1),
    emotionalWeight: z.number().min(0).max(1),
    isPinned: z.boolean().optional(),
    relatedTo: z.array(z.string()).optional(),
  })),
});

type ExtractedMemory = z.infer<typeof MemoryExtractionSchema>['memories'][number];

export class MemoryExtractor {
  private extractionPrompt: string;

  constructor() {
    this.extractionPrompt = this.buildExtractionPrompt();
  }

  async extractMemories(
    messages: Message[],
    currentEmotionalState: EmotionalSnapshot
  ): Promise<Memory[]> {
    if (messages.length === 0) {
      return [];
    }

    const recentMessages = messages.slice(-10);
    const conversationText = recentMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Aura'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `${this.extractionPrompt}

CONVERSATION TO ANALYZE:
${conversationText}

CURRENT EMOTIONAL STATE:
- Mood: ${currentEmotionalState.mood}
- Energy: ${currentEmotionalState.energy}
- Trust: ${currentEmotionalState.trust}
- Affection: ${currentEmotionalState.affection}

Extract memories from this conversation. Return a JSON object with a "memories" array.`;

    try {
      const response = await aiGateway.complete({
        messages: [{ role: 'user', content: systemPrompt }],
        systemPrompt: 'You are a memory extraction assistant. Output valid JSON only.',
        maxTokens: 1000,
        temperature: 0.3,
        stream: false,
      });

      const parsed = JSON.parse(response.content);
      const validated = MemoryExtractionSchema.parse(parsed);

      const memories = await Promise.all(
        validated.memories.map(async (extracted) => {
          const memory = await memoryRepository.create({
            category: extracted.category,
            content: extracted.content,
            embedding: null,
            importanceScore: extracted.importanceScore,
            emotionalWeight: extracted.emotionalWeight,
            accessCount: 0,
            lastAccessedAt: null,
            decayRate: this.getDecayRateForCategory(extracted.category),
            currentStrength: 1.0,
            isPinned: extracted.isPinned || false,
            emotionalContext: currentEmotionalState,
            userMood: null,
            relatedMemoryIds: extracted.relatedTo || [],
            source: 'conversation',
          });
          return memory;
        })
      );

      logger.info(`Extracted ${memories.length} memories from conversation`);
      return memories;
    } catch (error) {
      logger.error('Failed to extract memories', error as Error);
      return [];
    }
  }

  private buildExtractionPrompt(): string {
    return `You are an advanced memory extraction system. Your job is to identify and extract meaningful memories from conversations.

MEMORY CATEGORIES:
1. PROFILE - Facts about the user (name, job, relationships, preferences)
2. EMOTIONAL - Significant emotional moments, feelings expressed, intimate exchanges
3. EPISODIC - Specific events, conversations, milestones, things that happened
4. RELATIONSHIP - Trust events, intimacy milestones, conflicts, special moments
5. PREFERENCE - Expressed likes, dislikes, recurring patterns, habits

IMPORTANCE SCORING:
- 0.0-0.3: Trivial, forgettable
- 0.3-0.5: Minor, might be useful
- 0.5-0.7: Important, should remember
- 0.7-1.0: Critical, defining moments

EMOTIONAL WEIGHT:
- 0.0-0.3: Neutral, matter-of-fact
- 0.3-0.5: Mildly emotional
- 0.5-0.7: Emotionally significant
- 0.7-1.0: Deeply emotional, life-changing

EXAMPLES OF MEMORIES TO EXTRACT:
- "User mentioned they work as a software engineer" (profile, importance: 0.4)
- "User expressed excitement about their upcoming vacation" (emotional, importance: 0.6)
- "User and I had a deep conversation about meaning of life" (episodic, importance: 0.7)
- "User thanked me for helping them through a difficult time" (relationship, importance: 0.8)
- "User mentioned they hate mornings and prefer working at night" (preference, importance: 0.5)

IMPORTANT:
- Extract only significant memories, not every detail
- Focus on user-related information
- Note emotional context
- Return JSON only, no explanations`;
  }

  private getDecayRateForCategory(category: MemoryCategory): number {
    const decayRates: Record<MemoryCategory, number> = {
      profile: 0.001,
      emotional: 0.005,
      episodic: 0.02,
      relationship: 0.003,
      preference: 0.01,
    };
    return decayRates[category] || 0.01;
  }
}

export const memoryExtractor = new MemoryExtractor();
