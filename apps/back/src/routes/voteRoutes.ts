import express from 'express';
import { authenticateParticipant } from '../middleware/authenticateParticipant';
import { submitVote } from '../controllers/voteController'

const router = express.Router();

router.post('/vote', authenticateParticipant, submitVote);

export default router;