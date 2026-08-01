
const Produit = require('../models/Produit');

// Créer un produit
const creerProduit = async (req, res) => {
  try {
    const { nom, prix, coutRevient, stock, description } = req.body;

    const produit = await Produit.create({
      commercant: req.commercantId,
      nom,
      prix,
      coutRevient,
      stock,
      description,
    });

    res.status(201).json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les produits du commerçant connecté
const listerProduits = async (req, res) => {
  try {
    const produits = await Produit.find({ commercant: req.commercantId }).sort({ createdAt: -1 });
    res.status(200).json(produits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier un produit
const modifierProduit = async (req, res) => {
  try {
    const produit = await Produit.findOne({ _id: req.params.id, commercant: req.commercantId });

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    Object.assign(produit, req.body);
    await produit.save();

    res.status(200).json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un produit
const supprimerProduit = async (req, res) => {
  try {
    const produit = await Produit.findOneAndDelete({ _id: req.params.id, commercant: req.commercantId });

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    res.status(200).json({ message: 'Produit supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerProduit, listerProduits, modifierProduit, supprimerProduit };