// middleware/authenticateParticipant.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface ParticipantPayload {
  sessionId: string;
  participantToken: string;
}

export interface AuthenticatedParticipantRequest extends Request {
  participant?: ParticipantPayload;
}

export const authenticateParticipant = (
  req: AuthenticatedParticipantRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Token participant manquant' });
    return;
  }

  if (!process.env.PARTICIPANT_JWT_SECRET) {
    res.status(500).json({ message: 'Configuration serveur invalide' });
    return;
  }

  try {
    req.participant = jwt.verify(
      token,
      process.env.PARTICIPANT_JWT_SECRET
    ) as ParticipantPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Token participant invalide ou expiré' });
  }
};