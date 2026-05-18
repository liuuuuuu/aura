import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalityEngine } from '../server/modules/personality-engine/PersonalityEngine';
import type { AuraInternalState, StateTrigger } from '../shared-types/personality.types';

describe('PersonalityEngine', () => {
  let engine: PersonalityEngine;

  beforeEach(() => {
    engine = new PersonalityEngine();
  });

  describe('getState', () => {
    it('should return current state with default values', () => {
      const state = engine.getState();

      expect(state).toBeDefined();
      expect(state.mood).toBe(0);
      expect(state.energy).toBeGreaterThanOrEqual(0);
      expect(state.energy).toBeLessThanOrEqual(1);
      expect(state.trust).toBeGreaterThanOrEqual(0);
      expect(state.trust).toBeLessThanOrEqual(1);
    });

    it('should return a copy, not the original state', () => {
      const state1 = engine.getState();
      const state2 = engine.getState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('getMood', () => {
    it('should return neutral mood for mood value around 0', () => {
      engine.updateState({ mood: 0 });
      expect(engine.getMood()).toBe('neutral');
    });

    it('should return happy mood for high positive mood', () => {
      engine.updateState({ mood: 0.8 });
      expect(engine.getMood()).toBe('happy');
    });

    it('should return sad mood for low negative mood', () => {
      engine.updateState({ mood: -0.8 });
      expect(engine.getMood()).toBe('tired');
    });

    it('should return warm mood for moderate positive mood', () => {
      engine.updateState({ mood: 0.5 });
      expect(engine.getMood()).toBe('warm');
    });
  });

  describe('getRelationshipStage', () => {
    it('should return stranger for low trust', () => {
      engine.updateState({ trust: 0.1 });
      expect(engine.getRelationshipStage()).toBe('stranger');
    });

    it('should return bonded for very high trust', () => {
      engine.updateState({ trust: 0.9 });
      expect(engine.getRelationshipStage()).toBe('bonded');
    });

    it('should return close for high trust', () => {
      engine.updateState({ trust: 0.7 });
      expect(engine.getRelationshipStage()).toBe('close');
    });
  });

  describe('triggerEvent', () => {
    it('should increase trust on positive interaction', () => {
      const initialTrust = engine.getState().trust;
      engine.triggerEvent('user_message_positive');
      
      const newTrust = engine.getState().trust;
      expect(newTrust).toBeGreaterThan(initialTrust);
    });

    it('should decrease trust on negative interaction', () => {
      engine.updateState({ trust: 0.5 });
      const initialTrust = engine.getState().trust;
      engine.triggerEvent('user_message_negative');
      
      const newTrust = engine.getState().trust;
      expect(newTrust).toBeLessThan(initialTrust);
    });

    it('should increase affection on intimate moment', () => {
      const initialAffection = engine.getState().affection;
      engine.triggerEvent('user_message_intimate');
      
      const newAffection = engine.getState().affection;
      expect(newAffection).toBeGreaterThan(initialAffection);
    });

    it('should increase loneliness on long absence', () => {
      const initialLoneliness = engine.getState().loneliness;
      engine.triggerEvent('long_absence');
      
      const newLoneliness = engine.getState().loneliness;
      expect(newLoneliness).toBeGreaterThan(initialLoneliness);
    });

    it('should increase engagement on session start', () => {
      engine.triggerEvent('session_start');
      const state = engine.getState();
      
      expect(state.engagement).toBeGreaterThanOrEqual(0.7);
    });

    it('should decrease engagement on session end', () => {
      engine.updateState({ engagement: 0.8 });
      engine.triggerEvent('session_end');
      
      const state = engine.getState();
      expect(state.engagement).toBeLessThan(0.8);
    });
  });

  describe('updateState', () => {
    it('should update specific state values', () => {
      engine.updateState({ mood: 0.5, energy: 0.8 });
      
      const state = engine.getState();
      expect(state.mood).toBe(0.5);
      expect(state.energy).toBe(0.8);
    });

    it('should clamp values to valid ranges', () => {
      engine.updateState({ mood: 5, trust: 2 });
      
      const state = engine.getState();
      expect(state.mood).toBeLessThanOrEqual(1);
      expect(state.trust).toBeLessThanOrEqual(1);
    });
  });

  describe('applyTimeDecay', () => {
    it('should decrease trust over time', () => {
      engine.updateState({ trust: 0.5 });
      const initialTrust = engine.getState().trust;
      
      engine.applyTimeDecay(24);
      
      const newTrust = engine.getState().trust;
      expect(newTrust).toBeLessThan(initialTrust);
    });

    it('should increase loneliness over time', () => {
      engine.updateState({ loneliness: 0.2 });
      const initialLoneliness = engine.getState().loneliness;
      
      engine.applyTimeDecay(24);
      
      const newLoneliness = engine.getState().loneliness;
      expect(newLoneliness).toBeGreaterThan(initialLoneliness);
    });
  });

  describe('getResponseModifiers', () => {
    it('should return valid modifiers', () => {
      const modifiers = engine.getResponseModifiers();
      
      expect(modifiers).toBeDefined();
      expect(modifiers.sentenceLength).toMatch(/^(short|normal|varied)$/);
      expect(modifiers.pacingFactor).toBeGreaterThan(0);
      expect(modifiers.emotionalExpression).toMatch(/^(warm|moderate|restrained)$/);
      expect(modifiers.formalityLevel).toMatch(/^(formal|casual|intimate)$/);
    });

    it('should adjust pacing based on energy', () => {
      engine.updateState({ energy: 0.1 });
      const lowEnergyModifiers = engine.getResponseModifiers();
      
      engine.updateState({ energy: 0.9 });
      const highEnergyModifiers = engine.getResponseModifiers();
      
      expect(lowEnergyModifiers.pacingFactor).toBeGreaterThan(highEnergyModifiers.pacingFactor);
    });
  });

  describe('getStateHistory', () => {
    it('should track state changes', () => {
      engine.triggerEvent('session_start');
      engine.triggerEvent('user_message_positive');
      
      const history = engine.getStateHistory(5);
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].trigger).toBe('user_message_positive');
    });

    it('should limit history to specified size', () => {
      for (let i = 0; i < 10; i++) {
        engine.triggerEvent('session_start');
      }
      
      const history = engine.getStateHistory(3);
      expect(history.length).toBeLessThanOrEqual(3);
    });
  });
});
