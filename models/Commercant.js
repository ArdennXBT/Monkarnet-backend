
const mongoose = require('mongoose');

const commercantSchema = new mongoose.Schema(
  {
    nomComplet: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    motDePasse: {
      type: String,
      required: true,
    },
    nomCommerce: {
      type: String,
      required: true,
      trim: true,
    },
    typeCommerce: {
      type: String,
      trim: true,
    },
    adresse: {
      type: String,
      trim: true,
    },
    telephone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['commercant', 'sous-compte', 'superadmin'],
      default: 'commercant',
    },
    parentCommercant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commercant',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Commercant', commercantSchema);