import express from 'express';

import {
  createSession,
  getSessionById,
  getSessionByIdUser,
} from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/', getSessionById);
router.get('/:id', getSessionByIdUser);

export default router;