import { Request, Response } from 'express';
import { JwtPayload } from "../types/auth";
import mongoose from "mongoose";
import Question from '../models/Question';

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

    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      res.status(404).json({
        message: 'Question introuvable',
      });
      return;
    }

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