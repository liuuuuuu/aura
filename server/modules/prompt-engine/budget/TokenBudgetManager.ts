export const TOKEN_BUDGET = {
  total: 8192,
  
  allocation: {
    systemPrompt: 1200,
    personalityCtx: 400,
    memoryContext: 1500,
    conversationHistory: 3000,
    responseReserve: 1500,
    safetyBuffer: 592,
  },
  
  degradation: {
    order: ['conversationHistory', 'memoryContext', 'personalityCtx'],
    minConversationTurns: 4,
    minMemories: 2,
  }
} as const;

export interface TokenBudgetAllocation {
  systemPrompt: number;
  personalityCtx: number;
  memoryContext: number;
  conversationHistory: number;
  responseReserve: number;
  safetyBuffer: number;
}

export class TokenBudgetManager {
  private budget: typeof TOKEN_BUDGET;
  private currentUsage: TokenBudgetAllocation;

  constructor(customBudget?: Partial<typeof TOKEN_BUDGET>) {
    this.budget = { ...TOKEN_BUDGET, ...customBudget };
    this.currentUsage = { ...this.budget.allocation };
  }

  calculateUsage(
    systemPromptLength: number,
    personalityCtxLength: number,
    memoryContextLength: number,
    conversationHistoryLength: number
  ): {
    total: number;
    withinBudget: boolean;
    overflow: number;
    suggestedTrims: string[];
  } {
    const systemPromptTokens = this.estimateTokens(systemPromptLength);
    const personalityCtxTokens = this.estimateTokens(personalityCtxLength);
    const memoryContextTokens = this.estimateTokens(memoryContextLength);
    const conversationHistoryTokens = this.estimateTokens(conversationHistoryLength);

    const total = 
      systemPromptTokens +
      personalityCtxTokens +
      memoryContextTokens +
      conversationHistoryTokens +
      this.budget.allocation.responseReserve +
      this.budget.allocation.safetyBuffer;

    const withinBudget = total <= this.budget.total;
    const overflow = withinBudget ? 0 : total - this.budget.total;

    const suggestedTrims: string[] = [];
    if (overflow > 0) {
      for (const section of this.budget.degradation.order) {
        if (overflow <= 0) break;
        
        switch (section) {
          case 'conversationHistory':
            suggestedTrims.push(`Reduce conversation history by ${Math.ceil(overflow / 4)} tokens`);
            break;
          case 'memoryContext':
            suggestedTrims.push(`Reduce memory context by ${Math.ceil(overflow / 4)} tokens`);
            break;
          case 'personalityCtx':
            suggestedTrims.push(`Reduce personality context by ${Math.ceil(overflow / 4)} tokens`);
            break;
        }
      }
    }

    return {
      total,
      withinBudget,
      overflow,
      suggestedTrims,
    };
  }

  allocateBudget(
    systemPrompt: string,
    personalityCtx: string,
    memoryContext: string,
    conversationHistory: string
  ): {
    allocated: TokenBudgetAllocation;
    truncated: {
      conversationHistory: string;
      memoryContext: string;
      personalityCtx: string;
    };
  } {
    const usage = this.calculateUsage(
      systemPrompt.length,
      personalityCtx.length,
      memoryContext.length,
      conversationHistory.length
    );

    let conversationHistoryTruncated = conversationHistory;
    let memoryContextTruncated = memoryContext;
    let personalityCtxTruncated = personalityCtx;

    if (!usage.withinBudget) {
      const maxConversationTokens = this.budget.allocation.conversationHistory;
      const maxMemoryTokens = this.budget.allocation.memoryContext;
      const maxPersonalityTokens = this.budget.allocation.personalityCtx;

      const currentConversationTokens = this.estimateTokens(conversationHistory.length);
      const currentMemoryTokens = this.estimateTokens(memoryContext.length);
      const currentPersonalityTokens = this.estimateTokens(personalityCtx.length);

      if (currentConversationTokens > maxConversationTokens) {
        conversationHistoryTruncated = this.truncateToTokens(
          conversationHistory,
          Math.max(
            this.estimateTokens(this.budget.degradation.minConversationTurns * 50),
            maxConversationTokens
          )
        );
      }

      if (currentMemoryTokens > maxMemoryTokens) {
        memoryContextTruncated = this.truncateToTokens(
          memoryContext,
          Math.max(
            this.estimateTokens(this.budget.degradation.minMemories * 100),
            maxMemoryTokens
          )
        );
      }

      if (currentPersonalityTokens > maxPersonalityTokens) {
        personalityCtxTruncated = this.truncateToTokens(
          personalityCtx,
          maxPersonalityTokens
        );
      }
    }

    return {
      allocated: {
        systemPrompt: this.estimateTokens(systemPrompt.length),
        personalityCtx: this.estimateTokens(personalityCtxTruncated.length),
        memoryContext: this.estimateTokens(memoryContextTruncated.length),
        conversationHistory: this.estimateTokens(conversationHistoryTruncated.length),
        responseReserve: this.budget.allocation.responseReserve,
        safetyBuffer: this.budget.allocation.safetyBuffer,
      },
      truncated: {
        conversationHistory: conversationHistoryTruncated,
        memoryContext: memoryContextTruncated,
        personalityCtx: personalityCtxTruncated,
      },
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars);
  }

  getBudgetStatus(): {
    total: number;
    allocation: TokenBudgetAllocation;
    utilizationPercentage: number;
  } {
    const currentTotal = Object.values(this.currentUsage).reduce((sum, val) => sum + val, 0);
    const utilizationPercentage = (currentTotal / this.budget.total) * 100;

    return {
      total: this.budget.total,
      allocation: this.currentUsage,
      utilizationPercentage,
    };
  }
}

export const tokenBudgetManager = new TokenBudgetManager();
