const Categorie = require('../models/Categorie');

// Créer une catégorie
const creerCategorie = async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const categorie = await Categorie.create({
      commercant: req.commercantId,
      nom: nom.trim(),
    });

    res.status(201).json(categorie);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cette catégorie existe déjà.' });
    }
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les catégories du commerçant connecté
const listerCategories = async (req, res) => {
  try {
    const categories = await Categorie.find({ commercant: req.commercantId }).sort({ nom: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer une catégorie
const supprimerCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findOneAndDelete({ _id: req.params.id, commercant: req.commercantId });

    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    res.status(200).json({ message: 'Catégorie supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerCategorie, listerCategories, supprimerCategorie };