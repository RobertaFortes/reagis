import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/Session', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../../models/Question', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    bulkWrite: vi.fn(),
  },
}));

import Session from '../../models/Session';
import Question from '../../models/Question';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../questionController';

const SESSION_ID = '64b000000000000000000001';
const QUESTION_ID = '64b000000000000000000002';

function mockReq(overrides: Record<string, any> = {}) {
  return {
    params: {},
    body: {},
    user: { userId: 'user-1' },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('questionController — contrôle du propriétaire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuestion', () => {
    const body = { session: SESSION_ID, text: 'Q ?', order: 1, options: [] };

    it('returns 404 when the session does not exist', async () => {
      vi.mocked(Session.findById).mockResolvedValue(null);
      const res = mockRes();

      await createQuestion(mockReq({ body }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(Question.create).not.toHaveBeenCalled();
    });

    it('returns 403 when the session belongs to another presenter', async () => {
      vi.mocked(Session.findById).mockResolvedValue({ presenter: 'other-user' } as any);
      const res = mockRes();

      await createQuestion(mockReq({ body }), res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Non autorisé' });
      expect(Question.create).not.toHaveBeenCalled();
    });

    it('creates the question when the presenter owns the session', async () => {
      vi.mocked(Session.findById).mockResolvedValue({ presenter: 'user-1' } as any);
      vi.mocked(Question.create).mockResolvedValue({ _id: QUESTION_ID } as any);
      const res = mockRes();

      await createQuestion(mockReq({ body }), res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Question.create).toHaveBeenCalled();
    });
  });

  describe('updateQuestion', () => {
    function mockFoundQuestion(presenter: string) {
      const question = {
        text: 'Ancienne',
        session: { status: 'draft', presenter },
        save: vi.fn(),
      };
      vi.mocked(Question.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(question),
      } as any);
      return question;
    }

    it('returns 403 when the question belongs to another presenter', async () => {
      const question = mockFoundQuestion('other-user');
      const res = mockRes();

      await updateQuestion(
        mockReq({ params: { id: QUESTION_ID }, body: { text: 'Piratée' } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(question.save).not.toHaveBeenCalled();
      expect(question.text).toBe('Ancienne');
    });

    it('updates the question when the presenter owns the session', async () => {
      const question = mockFoundQuestion('user-1');
      const res = mockRes();

      await updateQuestion(
        mockReq({ params: { id: QUESTION_ID }, body: { text: 'Nouvelle' } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(question.save).toHaveBeenCalled();
      expect(question.text).toBe('Nouvelle');
    });
  });

  describe('deleteQuestion', () => {
    it('returns 403 and does not delete when the session belongs to another presenter', async () => {
      const question = { session: SESSION_ID, deleteOne: vi.fn() };
      vi.mocked(Question.findById).mockResolvedValue(question as any);
      vi.mocked(Session.findById).mockResolvedValue({ presenter: 'other-user' } as any);
      const res = mockRes();

      await deleteQuestion(mockReq({ params: { id: QUESTION_ID } }), res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(question.deleteOne).not.toHaveBeenCalled();
    });

    it('deletes the question when the presenter owns the session', async () => {
      const question = { session: SESSION_ID, deleteOne: vi.fn() };
      vi.mocked(Question.findById).mockResolvedValue(question as any);
      vi.mocked(Session.findById).mockResolvedValue({ presenter: 'user-1' } as any);
      const res = mockRes();

      await deleteQuestion(mockReq({ params: { id: QUESTION_ID } }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(question.deleteOne).toHaveBeenCalled();
    });
  });

  describe('reorderQuestions', () => {
    it('returns 403 and does not write when the session belongs to another presenter', async () => {
      vi.mocked(Session.findById).mockResolvedValue({ presenter: 'other-user' } as any);
      const res = mockRes();

      await reorderQuestions(
        mockReq({ params: { sessionId: SESSION_ID }, body: { questionIds: [QUESTION_ID] } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(Question.bulkWrite).not.toHaveBeenCalled();
    });
  });
});
