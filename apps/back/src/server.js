require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' },
});

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes (à décommenter au fur et à mesure)
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/sessions', require('./routes/session.routes'));
// app.use('/api/questions', require('./routes/question.routes'));
// app.use('/api/votes', require('./routes/vote.routes'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Sockets (à activer en semaine 3)
// require('./sockets')(io);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connecté');
    server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur de connexion MongoDB', err);
    process.exit(1);
  });
