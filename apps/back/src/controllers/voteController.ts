// controllers/voteController.ts
import { Request, Response } from 'express';
import Vote from '../models/Vote';
import { AuthenticatedParticipantRequest } from '../middleware/authenticateParticipant';

export const submitVote = async (
  req: AuthenticatedParticipantRequest,
  res: Response
): Promise<void> => {
  try {
    const { questionId, optionIndex } = req.body;
    const { participantToken } = req.participant!;

    const vote = await Vote.create({
      question: questionId,
      participantToken,
      optionIndex,
    });

    res.status(201).json(vote);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'Vous avez déjà voté pour cette question' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du vote' });
  }
};