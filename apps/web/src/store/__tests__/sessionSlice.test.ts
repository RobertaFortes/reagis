import { describe, it, expect } from 'vitest';
import reducer, {
  setSession,
  sessionStarted,
  sessionEnded,
  clearSession,
  updateParticipantCount,
  type SessionState,
} from '@/store/sessionSlice';

const emptyState: SessionState = {
  id: null,
  name: '',
  code: '',
  status: '',
  currentQuestionIndex: 0,
  totalQuestions: 0,
  reaction: null,
  reactionCount: 0,
  participantCount: 0,
  floatingReactions: [],
};

const sampleSession: Omit<SessionState, 'participantCount'> = {
  id: 'sess-1',
  name: 'Demo Session',
  code: 'RG-ABCD',
  status: 'active',
  currentQuestionIndex: 2,
  totalQuestions: 5,
  reaction: null,
  reactionCount: 0,
  floatingReactions: [],
};

describe('sessionSlice', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(emptyState);
  });

  it('setSession should populate the state', () => {
    const state = reducer(emptyState, setSession(sampleSession));
    expect(state.id).toBe('sess-1');
    expect(state.name).toBe('Demo Session');
    expect(state.code).toBe('RG-ABCD');
    expect(state.status).toBe('active');
    expect(state.currentQuestionIndex).toBe(2);
  });

  it('sessionStarted should set status to active', () => {
    const prev: SessionState = { ...emptyState, status: 'draft' };
    const state = reducer(prev, sessionStarted());
    expect(state.status).toBe('active');
  });

  it('sessionEnded should set status to finished', () => {
    const prev: SessionState = { ...emptyState, status: 'active' };
    const state = reducer(prev, sessionEnded());
    expect(state.status).toBe('finished');
  });

  it('clearSession should reset to initial state', () => {
    const populated = reducer(emptyState, setSession(sampleSession));
    const state = reducer(populated, clearSession());
    expect(state).toEqual(emptyState);
  });

  it('updateParticipantCount should set the count', () => {
    const state = reducer(emptyState, updateParticipantCount(42));
    expect(state.participantCount).toBe(42);
  });
});
