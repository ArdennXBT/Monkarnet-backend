
const bcrypt = require('bcryptjs');
const Commercant = require('../models/Commercant');

// Créer un sous-compte
const creerSousCompte = async (req, res) => {
  try {
    const demandeur = await Commercant.findById(req.commercantId);

    if (demandeur.role !== 'commercant') {
      return res.status(403).json({ message: 'Seul le compte principal peut créer des sous-comptes.' });
    }

    const { nomComplet, email, motDePasse } = req.body;

    const existant = await Commercant.findOne({ email });
    if (existant) {
      return res.status(400).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const motDePasseHash = await bcrypt.hash(motDePasse, salt);

    const sousCompte = await Commercant.create({
      nomComplet,
      email,
      motDePasse: motDePasseHash,
      nomCommerce: demandeur.nomCommerce,
      role: 'sous-compte',
      parentCommercant: demandeur._id,
    });

    res.status(201).json({
      _id: sousCompte._id,
      nomComplet: sousCompte.nomComplet,
      email: sousCompte.email,
      role: sousCompte.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les sous-comptes du commerçant connecté
const listerSousComptes = async (req, res) => {
  try {
    const sousComptes = await Commercant.find({ parentCommercant: req.commercantId }).select('-motDePasse');
    res.status(200).json(sousComptes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un sous-compte
const supprimerSousCompte = async (req, res) => {
  try {
    const sousCompte = await Commercant.findOneAndDelete({
      _id: req.params.id,
      parentCommercant: req.commercantId,
    });

    if (!sousCompte) {
      return res.status(404).json({ message: 'Sous-compte introuvable.' });
    }

    res.status(200).json({ message: 'Sous-compte supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerSousCompte, listerSousComptes, supprimerSousCompte };