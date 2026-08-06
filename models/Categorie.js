
const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// Empêche un même commerçant de créer deux fois la même catégorie
categorieSchema.index({ commercant: 1, nom: 1 }, { unique: true });

module.exports = mongoose.model('Categorie', categorieSchema);