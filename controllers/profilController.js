
const Commercant = require('../models/Commercant');

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

module.exports = { getProfil, modifierProfil, modifierPhoto };