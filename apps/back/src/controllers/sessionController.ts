import Session from '../models/Session';
import Question from '../models/Question';
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

    // Active la première question
    const firstQuestion = await Question.findOne({ session: session._id }).sort({ order: 1 });
    if (firstQuestion) {
      firstQuestion.status = 'active';
      await firstQuestion.save();
    }

    session.status = 'active';
    session.currentQuestionIndex = 0;
    session.startedAt = new Date();
    await session.save();

    const io = req.app.get('io');
    const room = sessionRoom(String(session._id));

    io.to(room).emit(WsEvents.SESSION_STARTED, {
      sessionId: session._id,
      status: 'active',
    });

    // Envoie la première question aux participants déjà connectés
    if (firstQuestion) {
      io.to(room).emit(WsEvents.QUESTION_CHANGED, {
        id: firstQuestion._id,
        text: firstQuestion.text,
        options: firstQuestion.options.map((o: any) => ({ label: o.label, votes: o.votes })),
        status: firstQuestion.status,
      });
    }

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

    if (session.status !== 'active' && session.status !== 'paused') {
      res.status(409).json({ message: 'Seule une session active ou en pause peut être terminée' });
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

// Helper partagé par next/previous : déplace le pointeur et broadcast.
const navigateQuestion = async (
  req: Request,
  res: Response,
  direction: 'next' | 'previous'
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
      res.status(409).json({ message: 'La session doit être active' });
      return;
    }

    const questions = await Question.find({ session: session._id }).sort({ order: 1 });

    const targetIndex = direction === 'next'
      ? session.currentQuestionIndex + 1
      : session.currentQuestionIndex - 1;

    if (targetIndex < 0 || targetIndex >= questions.length) {
      res.status(409).json({
        message: direction === 'next'
          ? 'Dernière question atteinte'
          : 'Première question atteinte',
      });
      return;
    }

    const targetQ = questions[targetIndex];

    // Active la question cible si elle est encore pending (première visite)
    if (targetQ.status === 'pending') {
      targetQ.status = 'active';
      await targetQ.save();
    }

    session.currentQuestionIndex = targetIndex;
    await session.save();

    const io = req.app.get('io');
    io.to(sessionRoom(String(session._id))).emit(WsEvents.QUESTION_CHANGED, {
      id: targetQ._id,
      text: targetQ.text,
      options: targetQ.options.map((o: any) => ({ label: o.label, votes: o.votes })),
      status: targetQ.status,
      currentQuestionIndex: targetIndex,
      totalQuestions: questions.length,
    });

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du changement de question' });
  }
};

export const nextQuestion = async (req: Request, res: Response): Promise<void> => {
  return navigateQuestion(req, res, 'next');
};

export const previousQuestion = async (req: Request, res: Response): Promise<void> => {
  return navigateQuestion(req, res, 'previous');
};

export const pauseSession = async (
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
      res.status(409).json({ message: 'Seule une session active peut être mise en pause' });
      return;
    }

    session.status = 'paused';
    await session.save();

    const io = req.app.get('io');
    io.to(sessionRoom(String(session._id))).emit(WsEvents.SESSION_PAUSED, {
      sessionId: session._id,
      status: 'paused',
    });

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise en pause de la session' });
  }
};

export const resumeSession = async (
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

    if (session.status !== 'paused') {
      res.status(409).json({ message: 'Seule une session en pause peut être reprise' });
      return;
    }

    session.status = 'active';
    await session.save();

    const io = req.app.get('io');
    io.to(sessionRoom(String(session._id))).emit(WsEvents.SESSION_RESUMED, {
      sessionId: session._id,
      status: 'active',
    });
    
    // Re-synchronise la question courante : sans ça, les participants
    // restent sans question après une reprise (le front n'a plus rien
    // depuis la mise en pause).
    const questions = await Question.find({ session: session._id }).sort({ order: 1 });
    const currentQ = questions[session.currentQuestionIndex];

    if (currentQ) {
      io.to(sessionRoom(String(session._id))).emit(WsEvents.QUESTION_CHANGED, {
        id: currentQ._id,
        text: currentQ.text,
        options: currentQ.options.map((o) => ({ label: o.label, votes: o.votes })),
        status: currentQ.status,
      });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la reprise de la session' });
  }
};

export const updateSession = async (
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
      res.status(409).json({ message: 'Seule une session en brouillon peut être modifiée' });
      return;
    }

    const { name, reaction } = req.body;

    if (name !== undefined) session.name = name;
    if (reaction !== undefined) session.reaction = reaction;

    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la session' });
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