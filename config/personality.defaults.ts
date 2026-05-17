import type { AuraInternalState, RelationshipStage } from '@shared/personality.types';

export const defaultPersonalityState: AuraInternalState = {
  mood: 0,
  energy: 0.7,
  stress: 0.1,
  loneliness: 0.2,
  trust: 0.3,
  affection: 0.3,
  dependency: 0.1,
  openness: 0.5,
  curiosity: 0.5,
  engagement: 0.5,
  lastUpdatedAt: new Date(),
  sessionStartState: null,
};

export const relationshipStageThresholds: Record<RelationshipStage, { min: number; max: number }> = {
  stranger: { min: 0.0, max: 0.2 },
  acquaintance: { min: 0.2, max: 0.4 },
  familiar: { min: 0.4, max: 0.6 },
  close: { min: 0.6, max: 0.8 },
  bonded: { min: 0.8, max: 1.0 },
};

export function getRelationshipStage(trust: number): RelationshipStage {
  if (trust < 0.2) return 'stranger';
  if (trust < 0.4) return 'acquaintance';
  if (trust < 0.6) return 'familiar';
  if (trust < 0.8) return 'close';
  return 'bonded';
}

export const stateTransitionRules = {
  positiveInteraction: {
    trust: 0.01,
    affection: 0.01,
    mood: 0.05,
  },
  negativeInteraction: {
    trust: -0.005,
    mood: -0.05,
  },
  intimateMoment: {
    trust: 0.02,
    affection: 0.03,
    openness: 0.02,
  },
  longAbsence: {
    loneliness: 0.1,
    trust: -0.01,
    affection: -0.01,
  },
  milestone: {
    trust: 0.05,
    affection: 0.05,
    dependency: 0.02,
  },
};
