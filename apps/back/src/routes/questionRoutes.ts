import express from 'express';

import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySession,
  reorderQuestions,
} from '../controllers/questionController';

const router = express.Router();

router.get('/session/:sessionId', getQuestionsBySession);

router.post('/', createQuestion);

router.patch('/:id', updateQuestion);

router.delete('/:id', deleteQuestion);

router.patch('/reorder/:sessionId', reorderQuestions);

export default router;