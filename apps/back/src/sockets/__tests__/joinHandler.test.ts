import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WsEvents, SessionStatus } from '@reagis/shared';

// Mock Session model
vi.mock('../../models/Session', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Session from '../../models/Session';
import { registerJoinHandler, type SessionSocket } from '../joinHandler';

function createMockSocket(): SessionSocket {
  const handlers: Record<string, Function> = {};
  return {
    on: vi.fn((event: string, handler: Function) => {
      handlers[event] = handler;
    }),
    join: vi.fn().mockResolvedValue(undefined),
    data: {},
    // helper to trigger a registered handler from tests
    _trigger: (event: string, ...args: any[]) => handlers[event]?.(...args),
  } as any;
}

function createMockIo() {
  return {
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
  } as any;
}

describe('registerJoinHandler', () => {
  let io: ReturnType<typeof createMockIo>;
  let socket: SessionSocket & { _trigger: Function };

  beforeEach(() => {
    vi.clearAllMocks();
    io = createMockIo();
    socket = createMockSocket() as any;
    registerJoinHandler(io, socket);
  });

  it('rejects finished sessions', async () => {
    vi.mocked(Session.findOne).mockResolvedValue({
      _id: 'sess-1',
      name: 'Test',
      code: 'RG-AAAA',
      status: SessionStatus.FINISHED,
    } as any);

    const ack = vi.fn();
    await socket._trigger(WsEvents.JOIN_SESSION, { code: 'RG-AAAA', participantToken: 'tok' }, ack);

    expect(ack).toHaveBeenCalledWith({ ok: false, error: 'Session terminée' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('accepts draft sessions and joins the room', async () => {
    vi.mocked(Session.findOne).mockResolvedValue({
      _id: 'sess-1',
      name: 'Draft Session',
      code: 'RG-BBBB',
      status: SessionStatus.DRAFT,
      currentQuestionIndex: 0,
      reaction: null,
      reactionCount: 0,
    } as any);

    const ack = vi.fn();
    await socket._trigger(WsEvents.JOIN_SESSION, { code: 'RG-BBBB', participantToken: 'tok' }, ack);

    expect(socket.join).toHaveBeenCalledWith('session:sess-1');
    expect(socket.data.sessionId).toBe('sess-1');
    expect(socket.data.participantToken).toBe('tok');
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        session: expect.objectContaining({
          id: 'sess-1',
          name: 'Draft Session',
          status: SessionStatus.DRAFT,
        }),
      })
    );
  });

  it('accepts active sessions and joins the room', async () => {
    vi.mocked(Session.findOne).mockResolvedValue({
      _id: 'sess-2',
      name: 'Active Session',
      code: 'RG-CCCC',
      status: SessionStatus.ACTIVE,
      currentQuestionIndex: 1,
      reaction: null,
      reactionCount: 0,
    } as any);

    const ack = vi.fn();
    await socket._trigger(WsEvents.JOIN_SESSION, { code: 'RG-CCCC', participantToken: 'tok2' }, ack);

    expect(socket.join).toHaveBeenCalledWith('session:sess-2');
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        session: expect.objectContaining({
          id: 'sess-2',
          status: SessionStatus.ACTIVE,
        }),
      })
    );
  });

  it('rejects when code or participantToken is missing', async () => {
    const ack = vi.fn();
    await socket._trigger(WsEvents.JOIN_SESSION, { code: 'RG-AAAA' }, ack);

    expect(ack).toHaveBeenCalledWith({ ok: false, error: 'code et participantToken requis' });
  });
});
