import type { AuraInternalState, AuraMood } from './personality.types';

export interface AuraStateUpdateEvent {
  type: 'state-update';
  payload: AuraInternalState;
}

export interface MoodChangeEvent {
  type: 'mood-change';
  payload: AuraMood;
}

export interface StreamStartEvent {
  type: 'stream-start';
  payload: {
    messageId: string;
  };
}

export interface StreamChunkEvent {
  type: 'stream-chunk';
  payload: {
    messageId: string;
    delta: string;
  };
}

export interface StreamEndEvent {
  type: 'stream-end';
  payload: {
    messageId: string;
    totalTokens: number;
  };
}

export type AuraEvent = 
  | AuraStateUpdateEvent
  | MoodChangeEvent
  | StreamStartEvent
  | StreamChunkEvent
  | StreamEndEvent;
