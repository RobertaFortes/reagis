import { Request, Response } from 'express';
import { JwtPayload } from "../types/auth";
import mongoose from "mongoose";
import Question from '../models/Question';
import Session from '../models/Session';

// Vérifie que la session existe et appartient au présentateur connecté.
// Envoie elle-même la réponse d'erreur (404/403) et renvoie false dans ce cas.
const ensureSessionOwner = async (
  sessionId: string,
  req: Request,
  res: Response
): Promise<boolean> => {
  const session = await Session.findById(sessionId);

  if (!session) {
    res.status(404).json({ message: 'Session introuvable' });
    return false;
  }

  if (String(session.presenter) !== req.user.userId) {
    res.status(403).json({ message: 'Non autorisé' });
    return false;
  }

  return true;
};

// Récupérer les questions d'une session
export const getQuestionsBySession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ message: 'Identifiant de session invalide' });
      return;
    }

    const questions = await Question.find({ session: sessionId }).sort({ order: 1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error('Erreur getQuestionsBySession :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des questions' });
  }
};

// Créer une question
export const createQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { session, text, order, options } = req.body;

    // Vérification de l'ID de session
    if (!mongoose.Types.ObjectId.isValid(session)) {
      res.status(400).json({
        message: 'Identifiant de session invalide',
      });
      return;
    }

    // Vérification des données obligatoires
    if (!text || order === undefined) {
      res.status(400).json({
        message: 'Le texte et l’ordre de la question sont obligatoires',
      });
      return;
    }

    if (!(await ensureSessionOwner(session, req, res))) return;

    const question = await Question.create({
      session,
      text,
      order,
      options: options || [],
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Erreur createQuestion :', error);

    res.status(500).json({
      message: 'Erreur lors de la création de la question',
    });
  }
};

// Modifier une question (session en draft uniquement)
export const updateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Identifiant de question invalide' });
      return;
    }

    const question = await Question.findById(id).populate('session', 'status presenter');

    if (!question) {
      res.status(404).json({ message: 'Question introuvable' });
      return;
    }

    const session = question.session as any;
    if (String(session.presenter) !== req.user.userId) {
      res.status(403).json({ message: 'Non autorisé' });
      return;
    }

    if (session.status !== 'draft') {
      res.status(409).json({ message: 'Seule une question d\'une session en brouillon peut être modifiée' });
      return;
    }

    const { text, options } = req.body;

    if (text !== undefined) question.text = text;
    if (options !== undefined) question.options = options;

    await question.save();

    res.status(200).json(question);
  } catch (error) {
    console.error('Erreur updateQuestion :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la question' });
  }
};

// Supprimer une question
export const deleteQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: 'Identifiant de question invalide',
      });
      return;
    }

    const question = await Question.findById(id);

    if (!question) {
      res.status(404).json({
        message: 'Question introuvable',
      });
      return;
    }

    if (!(await ensureSessionOwner(String(question.session), req, res))) return;

    await question.deleteOne();

    res.status(200).json({
      message: 'Question supprimée avec succès',
      question,
    });
  } catch (error) {
    console.error('Erreur deleteQuestion :', error);

    res.status(500).json({
      message: 'Erreur lors de la suppression de la question',
    });
  }
};

// Réordonner les questions d'une session
export const reorderQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { questionIds } = req.body;

    // Vérification de l'ID de session
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({
        message: 'Identifiant de session invalide',
      });
      return;
    }

    // Vérification du tableau
    if (!Array.isArray(questionIds)) {
      res.status(400).json({
        message: 'questions doit être un tableau',
      });
      return;
    }

    // Vérification des IDs
    const areValidIds = questionIds.every((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!areValidIds) {
      res.status(400).json({
        message: 'Un ou plusieurs identifiants de question sont invalides',
      });
      return;
    }

    if (!(await ensureSessionOwner(sessionId, req, res))) return;

    // Récupération des questions appartenant à la session
    const questions = await Question.find({
      _id: { $in: questionIds },
      session: sessionId,
    });

    // Vérification que toutes les questions existent
    if (questions.length !== questionIds.length) {
      res.status(400).json({
        message:
          'Une ou plusieurs questions n’existent pas ou n’appartiennent pas à cette session',
      });
      return;
    }

    // Création des opérations de mise à jour
    const operations = questionIds.map((questionId: string, index: number) => ({
      updateOne: {
        filter: {
          _id: questionId,
          session: sessionId,
        },
        update: {
          $set: {
            order: index + 1,
          },
        },
      },
    }));

    await Question.bulkWrite(operations);

    // Retourne les questions dans le nouvel ordre
    const updatedQuestions = await Question.find({
      session: sessionId,
    }).sort({ order: 1 });

    res.status(200).json(updatedQuestions);
  } catch (error) {
    console.error('Erreur reorderQuestions :', error);

    res.status(500).json({
      message: 'Erreur lors du réordonnancement des questions',
    });
  }
};