import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // hash bcrypt, jamais en clair
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['presenter', 'participant'],
      default: 'participant',
      // MVP : seuls les presenters créent un compte.
      // 'participant' est prévu pour l'évolution future (historique, classement).
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
