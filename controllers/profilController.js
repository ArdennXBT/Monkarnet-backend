const bcrypt = require('bcryptjs');
const Commercant = require('../models/Commercant');
const { envoyerCodeChangementEmail } = require('../utils/envoyerEmail');

const genererCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Récupérer les infos du compte connecté
const getProfil = async (req, res) => {
  try {
    const commercant = await Commercant.findById(req.commercantId).select('-motDePasse');

    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    res.status(200).json(commercant);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier les infos du commerce
const modifierProfil = async (req, res) => {
  try {
    const commercant = await Commercant.findById(req.commercantId);

    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    const { nomCommerce, typeCommerce, adresse, telephone } = req.body;

    if (nomCommerce !== undefined) commercant.nomCommerce = nomCommerce;
    if (typeCommerce !== undefined) commercant.typeCommerce = typeCommerce;
    if (adresse !== undefined) commercant.adresse = adresse;
    if (telephone !== undefined) commercant.telephone = telephone;

    await commercant.save();

    const commercantSansMotDePasse = commercant.toObject();
    delete commercantSansMotDePasse.motDePasse;

    res.status(200).json(commercantSansMotDePasse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier la photo de profil
const modifierPhoto = async (req, res) => {
  try {
    const commercant = await Commercant.findById(req.commercantId);

    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image envoyée.' });
    }

    commercant.photo = req.file.path;
    await commercant.save();

    const commercantSansMotDePasse = commercant.toObject();
    delete commercantSansMotDePasse.motDePasse;

    res.status(200).json(commercantSansMotDePasse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Étape 1 : demander le changement d'email (envoie un code à la NOUVELLE adresse)
const demanderChangementEmail = async (req, res) => {
  try {
    const { nouvelEmail, motDePasse } = req.body;

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    // On vérifie le mot de passe pour confirmer que c'est bien le propriétaire du compte
    const motDePasseValide = await bcrypt.compare(motDePasse, commercant.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
    }

    if (nouvelEmail === commercant.email) {
      return res.status(400).json({ message: 'Cette adresse est déjà la vôtre.' });
    }

    const existant = await Commercant.findOne({ email: nouvelEmail });
    if (existant) {
      return res.status(400).json({ message: 'Cette adresse email est déjà utilisée.' });
    }

    const code = genererCode();
    commercant.nouvelEmail = nouvelEmail;
    commercant.codeChangementEmail = code;
    commercant.codeChangementEmailExpire = new Date(Date.now() + 15 * 60 * 1000);
    await commercant.save();

    await envoyerCodeChangementEmail(nouvelEmail, commercant.nomComplet, code);

    res.status(200).json({ message: 'Un code de confirmation a été envoyé à votre nouvelle adresse.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Étape 2 : confirmer le changement d'email avec le code reçu
const confirmerChangementEmail = async (req, res) => {
  try {
    const { code } = req.body;

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    if (!commercant.nouvelEmail || !commercant.codeChangementEmail) {
      return res.status(400).json({ message: 'Aucune demande de changement en cours.' });
    }

    if (commercant.codeChangementEmail !== code) {
      return res.status(400).json({ message: 'Code incorrect.' });
    }

    if (new Date() > commercant.codeChangementEmailExpire) {
      return res.status(400).json({ message: 'Ce code a expiré. Recommencez la demande.' });
    }

    commercant.email = commercant.nouvelEmail;
    commercant.nouvelEmail = null;
    commercant.codeChangementEmail = null;
    commercant.codeChangementEmailExpire = null;
    await commercant.save();

    const commercantSansMotDePasse = commercant.toObject();
    delete commercantSansMotDePasse.motDePasse;

    res.status(200).json(commercantSansMotDePasse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Changer le mot de passe (utilisateur connecté, doit fournir l'ancien)
const changerMotDePasse = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    const motDePasseValide = await bcrypt.compare(ancienMotDePasse, commercant.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    const salt = await bcrypt.genSalt(10);
    commercant.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
    await commercant.save();

    res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  getProfil,
  modifierProfil,
  modifierPhoto,
  demanderChangementEmail,
  confirmerChangementEmail,
  changerMotDePasse,
};