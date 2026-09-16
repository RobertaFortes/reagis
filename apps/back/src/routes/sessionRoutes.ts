import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken';

import {
  createSession,
  getSessionById,
  getSessionByIdUser,
  joinSessionByCode,
  startSession,
  nextQuestion,
  previousQuestion,
  pauseSession,
  resumeSession,
  endSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/my-sessions', authenticateToken, getSessionByIdUser); //Attention à l'ordre
router.delete('/:id', authenticateToken, deleteSession);

router.patch('/:id', authenticateToken, updateSession);
router.patch('/:id/start', authenticateToken, startSession);
router.patch('/:id/next-question', authenticateToken, nextQuestion);
router.patch('/:id/previous-question', authenticateToken, previousQuestion);
router.patch('/:id/pause', authenticateToken, pauseSession);
router.patch('/:id/resume', authenticateToken, resumeSession);
router.patch('/:id/end', authenticateToken, endSession);

router.post('/code/:code', joinSessionByCode);

router.get('/:id', getSessionById);

export default router;