import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken';

import {
  createSession,
  getSessionById,
  getSessionByIdUser,
  joinSessionByCode,
  startSession,
  endSession,
} from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/my-sessions', authenticateToken, getSessionByIdUser); //Attention à l'ordre

router.patch('/:id/start', authenticateToken, startSession);
router.patch('/:id/end', authenticateToken, endSession);

router.post('/code/:code', joinSessionByCode);

router.get('/:id', getSessionById);

export default router;