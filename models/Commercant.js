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
    // --- Nouveaux champs pour les sous-comptes ---
    roleSousCompte: {
      type: String,
      enum: ['admin', 'vendeur', 'comptable', 'livreur'],
      default: 'vendeur',
    },
    derniereConnexion: {
      type: Date,
      default: null,
    },
    activites: [
      {
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Le statut est calculé automatiquement : "attente" tant que le sous-compte
// ne s'est jamais connecté, "actif" dès sa première connexion.
// Pas besoin de le gérer manuellement, ni de construire un flux d'invitation par email.
commercantSchema.virtual('statut').get(function () {
  return this.derniereConnexion ? 'actif' : 'attente';
});

commercantSchema.set('toJSON', { virtuals: true });
commercantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Commercant', commercantSchema);