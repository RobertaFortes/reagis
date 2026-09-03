import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();


// =========================
// SIGNUP
// =========================
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Vérification des données reçues
    if (!email || !password || !name) {
      return res.status(400).json({
        result: false,
        error: 'Email, password et name sont obligatoires',
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        result: false,
        error: 'Cet email est déjà utilisé',
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du presenter
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'presenter',
    });

    return res.status(201).json({
      result: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur signup:', error);

    return res.status(500).json({
      result: false,
      error: 'Erreur serveur',
    });
  }
});


// =========================
// LOGIN
// =========================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Vérification des données reçues
    if (!email || !password) {
      return res.status(400).json({
        result: false,
        error: 'Email et password sont obligatoires',
      });
    }

    // Recherche de l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        result: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    // Vérification du mot de passe
    const passwordIsValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        result: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    // Vérification de la clé JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET est manquant dans .env');
    }

    // Génération du JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    return res.status(200).json({
      result: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);

    return res.status(500).json({
      result: false,
      error: 'Erreur serveur',
    });
  }
});

 
export default router;