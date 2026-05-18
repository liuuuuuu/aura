import { Router } from 'express';
import { logger } from '../../src/shared/utils/logger';
import type { AuraInternalState } from '../../shared-types/personality.types';
import { defaultPersonalityState, stateTransitionRules } from '../../config/personality.defaults';

const router = Router();

let currentState: AuraInternalState = { ...defaultPersonalityState };
let stateHistory: Array<{ state: AuraInternalState; timestamp: Date }> = [];

router.get('/', (req, res) => {
  res.json({ state: currentState });
});

router.post('/trigger', (req, res) => {
  try {
    const { trigger } = req.body;

    if (!trigger) {
      res.status(400).json({ error: 'Trigger is required' });
      return;
    }

    const previousState = { ...currentState };

    switch (trigger) {
      case 'session_start':
        currentState.sessionStartState = previousState;
        currentState.engagement = 0.7;
        currentState.curiosity = 0.6;
        break;

      case 'session_end':
        currentState.engagement = 0.3;
        currentState.curiosity = 0.3;
        currentState.sessionStartState = null;
        break;

      case 'user_message_positive':
        currentState.mood += stateTransitionRules.positiveInteraction.mood;
        currentState.trust += stateTransitionRules.positiveInteraction.trust;
        currentState.affection += stateTransitionRules.positiveInteraction.affection;
        break;

      case 'user_message_negative':
        currentState.mood += stateTransitionRules.negativeInteraction.mood;
        currentState.trust += stateTransitionRules.negativeInteraction.trust;
        break;

      case 'user_message_intimate':
        currentState.trust += stateTransitionRules.intimateMoment.trust;
        currentState.affection += stateTransitionRules.intimateMoment.affection;
        currentState.openness += stateTransitionRules.intimateMoment.openness;
        currentState.mood += 0.1;
        break;

      case 'user_message_dismissive':
        currentState.stress += 0.1;
        currentState.affection -= 0.02;
        break;

      case 'long_absence':
        currentState.loneliness += stateTransitionRules.longAbsence.loneliness;
        currentState.trust += stateTransitionRules.longAbsence.trust;
        currentState.affection += stateTransitionRules.longAbsence.affection;
        break;

      case 'milestone_reached':
        currentState.trust += stateTransitionRules.milestone.trust;
        currentState.affection += stateTransitionRules.milestone.affection;
        currentState.dependency += stateTransitionRules.milestone.dependency;
        break;

      default:
        res.status(400).json({ error: 'Unknown trigger' });
        return;
    }

    clampStateValues(currentState);
    currentState.lastUpdatedAt = new Date();

    stateHistory.push({ state: { ...previousState }, timestamp: new Date() });
    if (stateHistory.length > 100) {
      stateHistory = stateHistory.slice(-100);
    }

    logger.info(`State triggered: ${trigger}`, { previousState, newState: currentState });

    res.json({
      state: currentState,
      previousState,
      trigger,
    });
  } catch (error) {
    logger.error('Trigger state error', error as Error);
    res.status(500).json({
      error: 'Failed to trigger state transition',
      message: (error as Error).message,
    });
  }
});

router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json({
    history: stateHistory.slice(-limit),
  });
});

router.patch('/', (req, res) => {
  try {
    const updates = req.body;
    const previousState = { ...currentState };

    Object.assign(currentState, updates);
    clampStateValues(currentState);
    currentState.lastUpdatedAt = new Date();

    res.json({
      state: currentState,
      previousState,
    });
  } catch (error) {
    logger.error('Update state error', error as Error);
    res.status(500).json({
      error: 'Failed to update state',
      message: (error as Error).message,
    });
  }
});

function clampStateValues(state: AuraInternalState): void {
  state.mood = Math.max(-1, Math.min(1, state.mood));
  state.energy = Math.max(0, Math.min(1, state.energy));
  state.stress = Math.max(0, Math.min(1, state.stress));
  state.loneliness = Math.max(0, Math.min(1, state.loneliness));
  state.trust = Math.max(0, Math.min(1, state.trust));
  state.affection = Math.max(0, Math.min(1, state.affection));
  state.dependency = Math.max(0, Math.min(1, state.dependency));
  state.openness = Math.max(0, Math.min(1, state.openness));
  state.curiosity = Math.max(0, Math.min(1, state.curiosity));
  state.engagement = Math.max(0, Math.min(1, state.engagement));
}

export default router;
