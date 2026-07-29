// Crée une session de démo (code RG-42) avec une question active.
// Usage : npm run seed:demo
import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import Session from '../src/models/Session';
import Question from '../src/models/Question';
import Vote from '../src/models/Vote';
import User from '../src/models/User';

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);

  // Les index uniques (dont l'anti-double-vote) doivent exister en base.
  await Promise.all([Session.syncIndexes(), Question.syncIndexes(), Vote.syncIndexes()]);

  const CODE = 'RG-42';

  // Idempotent : on repart d'une démo propre à chaque exécution.
  const previous = await Session.findOne({ code: CODE });
  if (previous) {
    const questions = await Question.find({ session: previous._id }, '_id');
    await Vote.deleteMany({ question: { $in: questions.map((q) => q._id) } });
    await Question.deleteMany({ session: previous._id });
    await Session.deleteOne({ _id: previous._id });
  }

  const presenter =
    (await User.findOne({ email: 'demo@reagis.local' })) ??
    (await User.create({
      name: 'Démo',
      email: 'demo@reagis.local',
      // Le schema impose un hash bcrypt, jamais de mot de passe en clair —
      // même pour un compte de démo.
      password: await bcrypt.hash('demo1234', 10),
      role: 'presenter',
    }));

  const session = await Session.create({
    name: 'Session de démo',
    code: CODE,
    presenter: presenter._id,
    status: 'active',
    startedAt: new Date(),
  });

  const question = await Question.create({
    session: session._id,
    text: 'Quel est votre langage préféré ?',
    order: 0,
    status: 'active',
    options: [{ label: 'TypeScript' }, { label: 'Python' }, { label: 'Rust' }],
  });

  console.log('Session de démo prête');
  console.log('  code       :', session.code);
  console.log('  sessionId  :', String(session._id));
  console.log('  questionId :', String(question._id));

  await mongoose.disconnect();
})();
