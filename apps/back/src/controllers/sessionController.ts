import Session from '../models/Session';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { WsEvents } from '@reagis/shared';
import { sessionRoom } from '../sockets/rooms';

interface CreateSessionBody {
  name: string;
  code: string;
  presenter: string;
  reaction?: '👍' | '❤️' | '🔥' | '👏';
}

export const createSession = async (
  req: Request<{}, {}, CreateSessionBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, code, presenter, reaction } = req.body;

    if (!name || !code || !presenter) {
      res.status(400).json({
        message: 'name, code et presenter sont obligatoires',
      });
      return;
    }

    const existingSession = await Session.findOne({
      code: code.toUpperCase(),
    });

    if (existingSession) {
      res.status(409).json({
        message: 'Ce code de session existe déjà',
      });
      return;
    }

    const session = await Session.create({
      name,
      code,
      presenter,
      reaction,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Erreur lors de la création de la session',
    });
  }
};

export const getSessionByIdUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sessions = await Session.find({
      presenter: req.user.userId,
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: `Erreur lors de la récupération des sessions du presenteur`,
    });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await Session.findById(id);
    
    if (!sessions) {
      return res.status(404).json({
        message: "Session introuvable",
      });
    }
    
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des sessions",
    });
  }
};

export const startSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      res.status(404).json({ message: 'Session introuvable' });
      return;
    }

    if (String(session.presenter) !== req.user.userId) {
      res.status(403).json({ message: 'Non autorisé' });
      return;
    }

    if (session.status !== 'draft') {
      res.status(409).json({ message: 'Seule une session en brouillon peut être démarrée' });
      return;
    }

    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    const io = req.app.get('io');
    io.to(sessionRoom(String(session._id))).emit(WsEvents.SESSION_STARTED, {
      sessionId: session._id,
      status: 'active',
    });

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du démarrage de la session' });
  }
};

export const endSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      res.status(404).json({ message: 'Session introuvable' });
      return;
    }

    if (String(session.presenter) !== req.user.userId) {
      res.status(403).json({ message: 'Non autorisé' });
      return;
    }

    if (session.status !== 'active') {
      res.status(409).json({ message: 'Seule une session active peut être terminée' });
      return;
    }

    session.status = 'finished';
    session.endedAt = new Date();
    await session.save();

    const io = req.app.get('io');
    io.to(sessionRoom(String(session._id))).emit(WsEvents.SESSION_ENDED, {
      sessionId: session._id,
      status: 'finished',
    });

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la fermeture de la session' });
  }
};

export const joinSessionByCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await Session.findOne({ code: req.params.code.toUpperCase() });

    if (!session) {
      res.status(404).json({ message: 'Session introuvable' });
      return;
    }

    if (!process.env.PARTICIPANT_JWT_SECRET) {
      res.status(500).json({ message: 'Configuration serveur invalide' });
      return;
    }

    const { deviceId } = req.body;

    if (!deviceId || typeof deviceId !== 'string') {
      res.status(400).json({ message: 'deviceId requis' });
      return;
    }

    // Déterministe : même device + même session => même token, toujours.
    // Différente session => token différent (pas de traçage cross-session).
    const participantToken = crypto
      .createHash('sha256')
      .update(`${deviceId}:${session._id.toString()}`)
      .digest('hex');

    const token = jwt.sign(
      {
        sessionId: session._id.toString(),
        participantToken,
      },
      process.env.PARTICIPANT_JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.status(200).json({ token, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion à la session' });
  }
};