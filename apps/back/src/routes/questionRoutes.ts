import express from 'express';

import {
  createQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../controllers/questionController';

const router = express.Router();

router.post('/', createQuestion);

router.delete('/:id', deleteQuestion);

router.patch('/reorder/:sessionId', reorderQuestions);

export default router;