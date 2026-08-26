// controllers/voteController.ts
import { Response } from 'express';
import Vote from '../models/Vote';
import Question from '../models/Question';
import { AuthenticatedParticipantRequest } from '../middleware/authenticateParticipant';

export const submitVote = async (
  req: AuthenticatedParticipantRequest,
  res: Response
): Promise<void> => {
  try {
    const { questionId, optionIndex } = req.body;

    if (!questionId || optionIndex === undefined || typeof optionIndex !== 'number') {
      res.status(400).json({ message: 'questionId et optionIndex sont requis' });
      return;
    }

    const { participantToken, sessionId } = req.participant!;

    const question = await Question.findById(questionId);
    if (!question || question.session.toString() !== sessionId) {
      res.status(403).json({ message: 'Question hors session' });
      return;
    }

    const vote = await Vote.create({
      question: questionId,
      participantToken,
      optionIndex,
    });

    await Question.findByIdAndUpdate(questionId, {
      $inc: { [`options.${optionIndex}.votes`]: 1 },
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