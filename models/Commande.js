
const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema(
  {
    commercant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commercant',
      required: true,
    },
    numero: {
      type: String,
      required: true,
    },
    
    client: {
      nom: { type: String, required: true },
      telephone: { type: String },
      adresse: { type: String },
    },
    produits: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Produit',
          default: null,
        },
        nomLibre: {
          type: String,
          trim: true,
          default: '',
        },
        quantite: {
          type: Number,
          required: true,
          default: 1,
        },
        prixUnitaire: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    statut: {
      type: String,
      enum: ['en_attente', 'en_cours', 'livree', 'litige', 'annulee'],
      default: 'en_attente',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Commande', commandeSchema);