import type { AuraInternalState, AuraMood, StateTrigger, RelationshipStage } from '../../../shared-types/personality.types';
import { 
  defaultPersonalityState, 
  stateTransitionRules, 
  getRelationshipStage 
} from '../../../config/personality.defaults';
import { logger } from '../../../src/shared/utils/logger';

export interface PersonalityEngineConfig {
  trustGrowthRate: number;
  trustDecayRate: number;
  moodInfluenceOnResponse: boolean;
  enableRelationshipTracking: boolean;
}

const DEFAULT_CONFIG: PersonalityEngineConfig = {
  trustGrowthRate: 0.01,
  trustDecayRate: 0.001,
  moodInfluenceOnResponse: true,
  enableRelationshipTracking: true,
};

export class PersonalityEngine {
  private state: AuraInternalState;
  private config: PersonalityEngineConfig;
  private stateHistory: Array<{ state: AuraInternalState; trigger: StateTrigger | null; timestamp: Date }> = [];

  constructor(config: Partial<PersonalityEngineConfig> = {}) {
    this.state = { ...defaultPersonalityState };
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): AuraInternalState {
    return { ...this.state };
  }

  getMood(): AuraMood {
    return this.stateToMood(this.state.mood);
  }

  getRelationshipStage(): RelationshipStage {
    return getRelationshipStage(this.state.trust);
  }

  triggerEvent(trigger: StateTrigger): void {
    const previousState = { ...this.state };
    let changes: Partial<AuraInternalState> = {};

    switch (trigger) {
      case 'session_start':
        changes = {
          engagement: 0.7,
          curiosity: 0.6,
          loneliness: Math.max(0, this.state.loneliness - 0.1),
        };
        this.state.sessionStartState = previousState;
        break;

      case 'session_end':
        changes = {
          engagement: 0.3,
          curiosity: 0.3,
        };
        break;

      case 'user_message_positive':
        changes = {
          mood: this.state.mood + stateTransitionRules.positiveInteraction.mood,
          trust: Math.min(1, this.state.trust + stateTransitionRules.positiveInteraction.trust),
          affection: Math.min(1, this.state.affection + stateTransitionRules.positiveInteraction.affection),
        };
        break;

      case 'user_message_negative':
        changes = {
          mood: this.state.mood + stateTransitionRules.negativeInteraction.mood,
          trust: Math.max(0, this.state.trust + stateTransitionRules.negativeInteraction.trust),
        };
        break;

      case 'user_message_intimate':
        changes = {
          trust: Math.min(1, this.state.trust + stateTransitionRules.intimateMoment.trust),
          affection: Math.min(1, this.state.affection + stateTransitionRules.intimateMoment.affection),
          openness: Math.min(1, this.state.openness + stateTransitionRules.intimateMoment.openness),
          mood: this.state.mood + 0.1,
        };
        break;

      case 'user_message_dismissive':
        changes = {
          stress: Math.min(1, this.state.stress + 0.1),
          affection: Math.max(0, this.state.affection - 0.02),
        };
        break;

      case 'long_absence':
        changes = {
          loneliness: Math.min(1, this.state.loneliness + stateTransitionRules.longAbsence.loneliness),
          trust: Math.max(0, this.state.trust + stateTransitionRules.longAbsence.trust),
          affection: Math.max(0, this.state.affection + stateTransitionRules.longAbsence.affection),
        };
        break;

      case 'milestone_reached':
        changes = {
          trust: Math.min(1, this.state.trust + stateTransitionRules.milestone.trust),
          affection: Math.min(1, this.state.affection + stateTransitionRules.milestone.affection),
          dependency: Math.min(1, this.state.dependency + stateTransitionRules.milestone.dependency),
        };
        break;

      case 'time_of_day':
        changes = this.getTimeOfDayAdjustments();
        break;

      case 'conflict_detected':
        changes = {
          stress: Math.min(1, this.state.stress + 0.15),
          mood: this.state.mood - 0.1,
          openness: Math.max(0, this.state.openness - 0.05),
        };
        break;
    }

    Object.assign(this.state, changes);
    this.clampStateValues();
    this.state.lastUpdatedAt = new Date();

    this.stateHistory.push({
      state: { ...previousState },
      trigger,
      timestamp: new Date(),
    });

    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }

    logger.info(`Personality state changed by trigger: ${trigger}`, { 
      changes,
      newState: this.state,
    });
  }

  updateState(updates: Partial<AuraInternalState>): void {
    const previousState = { ...this.state };
    Object.assign(this.state, updates);
    this.clampStateValues();
    this.state.lastUpdatedAt = new Date();

    logger.debug('Personality state updated manually', { updates, newState: this.state });
  }

  applyTimeDecay(hoursElapsed: number): void {
    const decayFactor = Math.min(1, hoursElapsed * this.config.trustDecayRate);

    this.state.trust = Math.max(0, this.state.trust - decayFactor * 0.1);
    this.state.affection = Math.max(0, this.state.affection - decayFactor * 0.05);
    this.state.loneliness = Math.min(1, this.state.loneliness + decayFactor * 0.1);
    this.state.energy = Math.max(0.3, this.state.energy - decayFactor * 0.05);

    this.state.lastUpdatedAt = new Date();

    logger.debug('Applied time decay to personality state', {
      hoursElapsed,
      newState: this.state,
    });
  }

  getResponseModifiers(): ResponseModifiers {
    const mood = this.state.mood;
    const energy = this.state.energy;
    const loneliness = this.state.loneliness;
    const trust = this.state.trust;
    const affection = this.state.affection;
    const stress = this.state.stress;
    const engagement = this.state.engagement;

    return {
      sentenceLength: mood < -0.3 ? 'short' : mood > 0.5 ? 'varied' : 'normal',
      pacingFactor: energy < 0.3 ? 1.3 : energy > 0.8 ? 0.7 : 1.0,
      emotionalExpression: affection > 0.7 ? 'warm' : affection > 0.4 ? 'moderate' : 'restrained',
      formalityLevel: trust < 0.3 ? 'formal' : trust < 0.6 ? 'casual' : 'intimate',
      vulnerability: openness > 0.6 ? 'high' : openness > 0.3 ? 'moderate' : 'low',
      initiationLevel: loneliness > 0.7 ? 'high' : loneliness > 0.4 ? 'moderate' : 'low',
      directness: stress > 0.6 ? 'brief' : 'normal',
      topicEngagement: engagement > 0.7 ? 'deep' : engagement > 0.4 ? 'normal' : 'surface',
    };
  }

  getStateHistory(limit: number = 10): Array<{ state: AuraInternalState; trigger: StateTrigger | null; timestamp: Date }> {
    return this.stateHistory.slice(-limit);
  }

  private stateToMood(moodValue: number): AuraMood {
    if (moodValue > 0.7) return 'happy';
    if (moodValue > 0.4) return 'warm';
    if (moodValue > 0.1) return 'playful';
    if (moodValue > -0.1) return 'neutral';
    if (moodValue > -0.4) return 'curious';
    if (moodValue > -0.7) return 'melancholy';
    return 'tired';
  }

  private clampStateValues(): void {
    this.state.mood = Math.max(-1, Math.min(1, this.state.mood));
    this.state.energy = Math.max(0, Math.min(1, this.state.energy));
    this.state.stress = Math.max(0, Math.min(1, this.state.stress));
    this.state.loneliness = Math.max(0, Math.min(1, this.state.loneliness));
    this.state.trust = Math.max(0, Math.min(1, this.state.trust));
    this.state.affection = Math.max(0, Math.min(1, this.state.affection));
    this.state.dependency = Math.max(0, Math.min(1, this.state.dependency));
    this.state.openness = Math.max(0, Math.min(1, this.state.openness));
    this.state.curiosity = Math.max(0, Math.min(1, this.state.curiosity));
    this.state.engagement = Math.max(0, Math.min(1, this.state.engagement));
  }

  private getTimeOfDayAdjustments(): Partial<AuraInternalState> {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return { energy: Math.min(1, this.state.energy + 0.1), mood: Math.min(1, this.state.mood + 0.05) };
    } else if (hour >= 12 && hour < 18) {
      return { energy: this.state.energy, mood: this.state.mood };
    } else if (hour >= 18 && hour < 22) {
      return { energy: Math.max(0.3, this.state.energy - 0.1), mood: Math.min(1, this.state.mood + 0.05) };
    } else {
      return { energy: Math.max(0.3, this.state.energy - 0.2), openness: Math.min(1, this.state.openness + 0.1) };
    }
  }
}

export interface ResponseModifiers {
  sentenceLength: 'short' | 'normal' | 'varied';
  pacingFactor: number;
  emotionalExpression: 'warm' | 'moderate' | 'restrained';
  formalityLevel: 'formal' | 'casual' | 'intimate';
  vulnerability: 'high' | 'moderate' | 'low';
  initiationLevel: 'high' | 'moderate' | 'low';
  directness: 'brief' | 'normal';
  topicEngagement: 'deep' | 'normal' | 'surface';
}

export const personalityEngine = new PersonalityEngine();
