const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0 }, // compteur dénormalisé — incrémenté en $inc atomique
});

const questionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true, // position dans la session
    },
    options: [optionSchema], // sous-documents embarqués, toujours lus ensemble
    status: {
      type: String,
      enum: ['pending', 'active', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

questionSchema.index({ session: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
