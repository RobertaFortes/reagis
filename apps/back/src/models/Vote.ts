import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },

    // Identité du votant — l'une des deux :
    // MVP : participantToken (anonyme, généré au join)
    // Évolution future : user (compte participant connecté)
    participantToken: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    optionIndex: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Au moins une identité obligatoire
voteSchema.pre('validate', function (next) {
  if (!this.user && !this.participantToken) {
    return next(new Error('Vote must have a user or a participantToken'));
  }
  next();
});

// 1 seul vote par identité par question — garanti par la base,
// pas par l'application (aucune race condition possible sous charge concurrente)
voteSchema.index(
  { question: 1, participantToken: 1 },
  { unique: true, partialFilterExpression: { participantToken: { $exists: true } } }
);
voteSchema.index(
  { question: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
);

export default mongoose.model('Vote', voteSchema);
