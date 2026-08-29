import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './sockets';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/sessionRoutes';
import questionRoutes from './routes/questionRoutes';
import voteRoutes from './routes/voteRoutes';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' },
});

app.set('io', io);
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use('/api/auth', authRoutes);


app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes (à décommenter au fur et à mesure)
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/votes', voteRoutes);


// Sockets — une session = une room. Les noms d'événements viennent de
// @reagis/shared (source unique de vérité, partagée avec le web ; le mobile
// duplique ces mêmes constantes localement).
registerSocketHandlers(io);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB connecté');
    server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur de connexion MongoDB', err);
    process.exit(1);
  });
