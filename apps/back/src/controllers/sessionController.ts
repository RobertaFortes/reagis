import Session from '../models/Session.js';
import { Request, Response } from 'express';
import { JwtPayload } from "../types/auth";

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