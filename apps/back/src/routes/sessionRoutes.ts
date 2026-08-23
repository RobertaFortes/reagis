import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken';

import {
  createSession,
  getSessionById,
  getSessionByIdUser,
  getSessionByCode,
  joinSessionByCode,
} from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/my-sessions', authenticateToken, getSessionByIdUser); //Attention à l'ordre
router.get("/code/:code", getSessionByCode);
router.post('/code/:code/join', joinSessionByCode);
router.get('/:id', getSessionById);
//router.get('/session', authenticateToken, getSessionByIdUser); //Attention à l'ordre

export default router;