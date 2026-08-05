const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema(
  {
    commercant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commercant',
      required: true,
    },
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    categorie: {
      type: String,
      default: 'Autre',
      trim: true,
    },
    prix: {
      type: Number,
      required: true,
    },
    coutRevient: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Produit', produitSchema);