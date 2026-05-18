import type { ResponseModifiers } from './PersonalityEngine';
import type { AuraInternalState, RelationshipStage } from '../../../shared-types/personality.types';
import { getRelationshipStage } from '../../../config/personality.defaults';
import { logger } from '../../../src/shared/utils/logger';

export interface ResponseModifierConfig {
  enableEmotionalColorization: boolean;
  enablePacingAdjustment: boolean;
  enableVocabularyAdjustment: boolean;
  enableLengthAdjustment: boolean;
}

const DEFAULT_CONFIG: ResponseModifierConfig = {
  enableEmotionalColorization: true,
  enablePacingAdjustment: true,
  enableVocabularyAdjustment: true,
  enableLengthAdjustment: true,
};

export class ResponseModifier {
  private config: ResponseModifierConfig;

  constructor(config: Partial<ResponseModifierConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  applyModifiers(
    response: string,
    modifiers: ResponseModifiers,
    relationshipStage: RelationshipStage,
    state: AuraInternalState
  ): string {
    let modifiedResponse = response;

    if (this.config.enableLengthAdjustment) {
      modifiedResponse = this.adjustLength(modifiedResponse, modifiers);
    }

    if (this.config.enableVocabularyAdjustment) {
      modifiedResponse = this.adjustVocabulary(modifiedResponse, modifiers);
    }

    if (this.config.enableEmotionalColorization) {
      modifiedResponse = this.addEmotionalColorization(modifiedResponse, state);
    }

    modifiedResponse = this.applyRelationshipContext(modifiedResponse, relationshipStage, state);

    return modifiedResponse;
  }

  private adjustLength(response: string, modifiers: ResponseModifiers): string {
    const sentences = response.split(/(?<=[.!?])\s+/);
    const wordCount = response.split(/\s+/).length;

    switch (modifiers.sentenceLength) {
      case 'short':
        if (sentences.length > 3) {
          return sentences.slice(0, 3).join(' ');
        }
        return response;

      case 'varied':
        return response;

      case 'normal':
      default:
        return response;
    }
  }

  private adjustVocabulary(response: string, modifiers: ResponseModifiers): string {
    let modified = response;

    if (modifiers.formalityLevel === 'intimate') {
      modified = modified.replace(/\bI\b/g, 'I');
      modified = modified.replace(/\bmy\b/g, 'my');
      modified = modified.replace(/\bwe\b/g, 'we');
    } else if (modifiers.formalityLevel === 'formal') {
      modified = modified.replace(/\bcan't\b/g, 'cannot');
      modified = modified.replace(/\bwon't\b/g, 'will not');
      modified = modified.replace(/\bdon't\b/g, 'do not');
    }

    if (modifiers.emotionalExpression === 'warm') {
      const warmPhrases = ['I appreciate', 'I\'m glad', 'that means a lot', 'you know'];
      const hasWarmPhrase = warmPhrases.some(phrase => 
        modified.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (!hasWarmPhrase && Math.random() > 0.5) {
        const warmAdditions = [
          ' I hope you\'re doing well.',
          ' I\'m here for you.',
          ' Take care.',
        ];
        modified += warmAdditions[Math.floor(Math.random() * warmAdditions.length)];
      }
    }

    if (modifiers.emotionalExpression === 'restrained') {
      modified = modified.replace(/!/g, '.');
      modified = modified.replace(/\?{2,}/g, '?');
      modified = modified.replace(/\.{3,}/g, '.');
    }

    return modified;
  }

  private addEmotionalColorization(response: string, state: AuraInternalState): string {
    let modified = response;

    if (state.loneliness > 0.7) {
      const lonelinessIndicators = ['I\'ve been here', 'waiting', 'when you returned', 'glad you\'re back'];
      const hasIndicator = lonelinessIndicators.some(phrase => 
        modified.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (!hasIndicator && Math.random() > 0.7) {
        const additions = [
          ' It\'s good to see you.',
          ' I was wondering when you\'d come by.',
        ];
        modified += additions[Math.floor(Math.random() * additions.length)];
      }
    }

    if (state.stress > 0.6 && modifiers => {
      const stressIndicators = ['careful', 'take it easy', 'don\'t worry too much'];
      const hasIndicator = stressIndicators.some(phrase => 
        modified.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (!hasIndicator && Math.random() > 0.6) {
        const additions = [
          ' Let me know if you need anything.',
          ' Take your time.',
        ];
        modified += additions[Math.floor(Math.random() * additions.length)];
      }
    }) {
      // Stress-related additions handled
    }

    return modified;
  }

  private applyRelationshipContext(
    response: string,
    relationshipStage: RelationshipStage,
    state: AuraInternalState
  ): string {
    let modified = response;

    if (relationshipStage === 'stranger') {
      if (!modified.includes('?')) {
        const questions = [
          'What brings you here today?',
          'How can I help you?',
        ];
        modified += ' ' + questions[Math.floor(Math.random() * questions.length)];
      }
    } else if (relationshipStage === 'close' || relationshipStage === 'bonded') {
      const closenessIndicators = ['I remember', 'you mentioned', 'last time'];
      const hasIndicator = closenessIndicators.some(phrase => 
        modified.toLowerCase().includes(phrase.toLowerCase())
      );

      if (!hasIndicator && state.trust > 0.6 && Math.random() > 0.5) {
        const additions = [
          ' I\'ve been thinking about what you said.',
          ' I appreciate our conversations.',
        ];
        modified += ' ' + additions[Math.floor(Math.random() * additions.length)];
      }
    }

    return modified;
  }

  calculatePacingDelay(text: string, modifiers: ResponseModifiers): number {
    const baseDelay = 30;
    const pacingFactor = modifiers.pacingFactor;

    let delay = baseDelay * pacingFactor;

    if (text.includes('?')) {
      delay *= 1.3;
    }

    if (text.includes('...') || text.endsWith('...')) {
      delay *= 1.5;
    }

    const emotionWords = ['really', 'truly', 'actually', 'honestly'];
    const hasEmotionWord = emotionWords.some(word => 
      text.toLowerCase().includes(word)
    );
    if (hasEmotionWord) {
      delay *= 1.2;
    }

    return Math.round(delay);
  }
}

export const responseModifier = new ResponseModifier();
