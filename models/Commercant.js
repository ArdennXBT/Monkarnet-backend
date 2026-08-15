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
    // --- Champs pour les sous-comptes ---
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
    // --- Vérification email ---
    emailVerifie: {
      type: Boolean,
      default: false,
    },
    codeVerification: {
      type: String,
      default: null,
    },
    codeVerificationExpire: {
      type: Date,
      default: null,
    },
    // --- Changement d'email ---
    nouvelEmail: {
      type: String,
      default: null,
    },
    codeChangementEmail: {
      type: String,
      default: null,
    },
    codeChangementEmailExpire: {
      type: Date,
      default: null,
    },
    // --- Réinitialisation mot de passe ---
    codeResetMotDePasse: {
      type: String,
      default: null,
    },
    codeResetMotDePasseExpire: {
      type: Date,
      default: null,
    },
    // --- Abonnement ---
    plan: {
      type: String,
      enum: ['gratuit', 'mensuel', 'annuel'],
      default: 'gratuit',
    },
    dateFinEssai: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours après création
    },
    dateFinAbonnement: {
      type: Date,
      default: null,
    },
    rappelEssaiEnvoye: {
      type: Boolean,
      default: false,
    },
    historiquePaiements: [
      {
        plan: { type: String, enum: ['mensuel', 'annuel'] },
        montant: { type: Number },
        transactionId: { type: String },
        statut: { type: String, enum: ['en_attente', 'reussi', 'echoue'], default: 'en_attente' },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Le statut est calculé automatiquement : "attente" tant que le sous-compte
// ne s'est jamais connecté, "actif" dès sa première connexion.
commercantSchema.virtual('statut').get(function () {
  return this.derniereConnexion ? 'actif' : 'attente';
});

// Jours restants de l'essai gratuit (null si plan payant déjà actif)
commercantSchema.virtual('essaiJoursRestants').get(function () {
  if (this.plan !== 'gratuit' || !this.dateFinEssai) return null;
  const diffMs = new Date(this.dateFinEssai) - new Date();
  const jours = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return jours > 0 ? jours : 0;
});

commercantSchema.set('toJSON', { virtuals: true });
commercantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Commercant', commercantSchema);