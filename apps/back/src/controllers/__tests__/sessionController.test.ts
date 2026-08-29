import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WsEvents } from '@reagis/shared';

// Mock Session model
vi.mock('../../models/Session', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import Session from '../../models/Session';
import { startSession } from '../sessionController';

function mockReq(overrides: Record<string, any> = {}) {
  return {
    params: { id: 'session-123' },
    user: { userId: 'user-1' },
    app: {
      get: vi.fn().mockReturnValue({
        to: vi.fn().mockReturnValue({ emit: vi.fn() }),
      }),
    },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('startSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when session not found', async () => {
    vi.mocked(Session.findById).mockResolvedValue(null);

    const req = mockReq();
    const res = mockRes();

    await startSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Session introuvable' });
  });

  it('returns 403 when user is not the session owner', async () => {
    vi.mocked(Session.findById).mockResolvedValue({
      _id: 'session-123',
      presenter: 'other-user',
      status: 'draft',
    } as any);

    const req = mockReq();
    const res = mockRes();

    await startSession(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non autorisé' });
  });

  it('returns 409 when session is not in draft status', async () => {
    vi.mocked(Session.findById).mockResolvedValue({
      _id: 'session-123',
      presenter: 'user-1',
      status: 'active',
    } as any);

    const req = mockReq();
    const res = mockRes();

    await startSession(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Seule une session en brouillon peut être démarrée',
    });
  });

  it('returns 200 and emits SESSION_STARTED on success', async () => {
    const sessionDoc = {
      _id: 'session-123',
      presenter: 'user-1',
      status: 'draft',
      startedAt: null as Date | null,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Session.findById).mockResolvedValue(sessionDoc as any);

    const emitFn = vi.fn();
    const toFn = vi.fn().mockReturnValue({ emit: emitFn });
    const ioMock = { to: toFn };

    const req = mockReq({
      app: { get: vi.fn().mockReturnValue(ioMock) },
    });
    const res = mockRes();

    await startSession(req, res);

    expect(sessionDoc.status).toBe('active');
    expect(sessionDoc.startedAt).toBeInstanceOf(Date);
    expect(sessionDoc.save).toHaveBeenCalled();

    expect(toFn).toHaveBeenCalledWith('session:session-123');
    expect(emitFn).toHaveBeenCalledWith(WsEvents.SESSION_STARTED, {
      sessionId: 'session-123',
      status: 'active',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(sessionDoc);
  });
});
