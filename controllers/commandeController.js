
const Commande = require('../models/Commande');
const Produit = require('../models/Produit');

// Créer une commande
const creerCommande = async (req, res) => {
  try {
    const { client, produits, statut } = req.body;

    let total = 0;

    // Vérifier chaque produit et calculer le total
    for (const item of produits) {
      const produit = await Produit.findOne({ _id: item.produit, commercant: req.commercantId });

      if (!produit) {
        return res.status(404).json({ message: `Produit introuvable.` });
      }

      if (produit.stock < item.quantite) {
        return res.status(400).json({ message: `Stock insuffisant pour ${produit.nom}.` });
      }

      total += item.prixUnitaire * item.quantite;

      // Déduire le stock
      produit.stock -= item.quantite;
      await produit.save();
    }

    const commande = await Commande.create({
      commercant: req.commercantId,
      client,
      produits,
      total,
      statut,
    });

    res.status(201).json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les commandes du commerçant connecté
const listerCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find({ commercant: req.commercantId })
      .populate('produits.produit', 'nom prix')
      .sort({ createdAt: -1 });

    res.status(200).json(commandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier le statut d'une commande
const modifierCommande = async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.commercantId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    if (req.body.statut) {
      commande.statut = req.body.statut;
    }

    await commande.save();

    res.status(200).json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer une commande
const supprimerCommande = async (req, res) => {
  try {
    const commande = await Commande.findOneAndDelete({ _id: req.params.id, commercant: req.commercantId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    res.status(200).json({ message: 'Commande supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerCommande, listerCommandes, modifierCommande, supprimerCommande };