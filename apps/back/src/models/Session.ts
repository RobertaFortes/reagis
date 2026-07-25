import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true, // "RG-42" — index unique pour la recherche rapide au join
      uppercase: true,
    },
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'finished'], // machine à états
      default: 'draft',
    },
    reaction: {
      type: String,
      enum: ['👍', '❤️', '🔥', '👏'], // configurée par le présentateur
      default: '👍',
    },
    reactionCount: {
      type: Number,
      default: 0, // incrémenté via $inc, broadcast throttled (~500ms)
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
