const bcrypt = require('bcryptjs');
const Commercant = require('../models/Commercant');

// Ajoute une entrée dans le journal d'activité d'un compte (garde les 20 dernières)
const enregistrerActivite = async (commercantId, description) => {
  try {
    await Commercant.findByIdAndUpdate(commercantId, {
      $push: {
        activites: {
          $each: [{ description, date: new Date() }],
          $position: 0,
          $slice: 20,
        },
      },
    });
  } catch (error) {
    console.error('Erreur enregistrement activité :', error.message);
  }
};

// Créer un sous-compte
const creerSousCompte = async (req, res) => {
  try {
    const demandeur = await Commercant.findById(req.commercantId);

    if (demandeur.role !== 'commercant') {
      return res.status(403).json({ message: 'Seul le compte principal peut créer des sous-comptes.' });
    }

    const { nomComplet, email, motDePasse, roleSousCompte } = req.body;

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
      roleSousCompte: roleSousCompte || 'vendeur',
      parentCommercant: demandeur._id,
    });

    await enregistrerActivite(sousCompte._id, `Compte créé par ${demandeur.nomComplet}`);

    const resultat = sousCompte.toObject();
    delete resultat.motDePasse;

    res.status(201).json(resultat);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les sous-comptes du commerçant connecté
const listerSousComptes = async (req, res) => {
  try {
    const sousComptes = await Commercant.find({ parentCommercant: req.commercantId })
      .select('-motDePasse')
      .sort({ createdAt: -1 });

    res.status(200).json(sousComptes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier un sous-compte (nom, email, rôle, mot de passe optionnel)
const modifierSousCompte = async (req, res) => {
  try {
    const sousCompte = await Commercant.findOne({
      _id: req.params.id,
      parentCommercant: req.commercantId,
    });

    if (!sousCompte) {
      return res.status(404).json({ message: 'Sous-compte introuvable.' });
    }

    const { nomComplet, email, motDePasse, roleSousCompte } = req.body;

    if (email && email !== sousCompte.email) {
      const existant = await Commercant.findOne({ email });
      if (existant) {
        return res.status(400).json({ message: 'Un compte existe déjà avec cet email.' });
      }
      sousCompte.email = email;
    }

    if (nomComplet) sousCompte.nomComplet = nomComplet;
    if (roleSousCompte) sousCompte.roleSousCompte = roleSousCompte;

    if (motDePasse) {
      const salt = await bcrypt.genSalt(10);
      sousCompte.motDePasse = await bcrypt.hash(motDePasse, salt);
    }

    await sousCompte.save();
    await enregistrerActivite(sousCompte._id, 'Informations du compte modifiées');

    const resultat = sousCompte.toObject();
    delete resultat.motDePasse;

    res.status(200).json(resultat);
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

module.exports = {
  creerSousCompte,
  listerSousComptes,
  modifierSousCompte,
  supprimerSousCompte,
  enregistrerActivite,
};