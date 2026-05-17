export interface AuraInternalState {
  mood: number;
  energy: number;
  stress: number;
  loneliness: number;
  trust: number;
  affection: number;
  dependency: number;
  openness: number;
  curiosity: number;
  engagement: number;
  lastUpdatedAt: Date;
  sessionStartState: AuraInternalState | null;
}

export type AuraMood = 
  | 'neutral'
  | 'happy'
  | 'warm'
  | 'curious'
  | 'melancholy'
  | 'stressed'
  | 'playful'
  | 'tired';

export interface StateTransitionEvent {
  trigger: StateTrigger;
  deltas: Partial<AuraInternalState>;
  reason: string;
}

export type StateTrigger =
  | 'user_message_positive'
  | 'user_message_negative'
  | 'user_message_intimate'
  | 'user_message_dismissive'
  | 'long_absence'
  | 'session_start'
  | 'session_end'
  | 'milestone_reached'
  | 'conflict_detected'
  | 'time_of_day';

export type RelationshipStage = 
  | 'stranger'
  | 'acquaintance'
  | 'familiar'
  | 'close'
  | 'bonded';

export interface EmotionalSnapshot {
  mood: number;
  energy: number;
  trust: number;
  affection: number;
}
