import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken';

import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySession,
  reorderQuestions,
} from '../controllers/questionController';

const router = express.Router();

router.get('/session/:sessionId', getQuestionsBySession);

router.post('/', authenticateToken, createQuestion);

router.patch('/:id', authenticateToken, updateQuestion);

router.delete('/:id', authenticateToken, deleteQuestion);

router.patch('/reorder/:sessionId', authenticateToken, reorderQuestions);

export default router;