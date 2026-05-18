import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AuraInternalState, AuraMood } from '@shared/personality.types';

interface AuraContextValue {
  state: AuraInternalState;
  mood: AuraMood;
  updateState: (newState: Partial<AuraInternalState>) => void;
  setMood: (mood: AuraMood) => void;
}

const defaultState: AuraInternalState = {
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

const AuraContext = createContext<AuraContextValue | undefined>(undefined);

export function AuraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuraInternalState>(defaultState);
  const [mood, setMoodState] = useState<AuraMood>('neutral');

  const updateState = useCallback((newState: Partial<AuraInternalState>) => {
    setState((prev) => ({
      ...prev,
      ...newState,
      lastUpdatedAt: new Date(),
    }));
  }, []);

  const setMood = useCallback((newMood: AuraMood) => {
    setMoodState(newMood);
  }, []);

  return (
    <AuraContext.Provider value={{ state, mood, updateState, setMood }}>
      {children}
    </AuraContext.Provider>
  );
}

export function useAura() {
  const context = useContext(AuraContext);
  if (!context) {
    throw new Error('useAura must be used within AuraProvider');
  }
  return context;
}
