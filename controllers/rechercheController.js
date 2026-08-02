
const Commande = require('../models/Commande');
const Produit = require('../models/Produit');
const Client = require('../models/Commercant'); // pas utilisé directement, gardé si besoin futur

const rechercherGlobal = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ commandes: [], produits: [] });
    }

    const terme = q.trim();
    const regex = new RegExp(terme, 'i');

    // Recherche dans les commandes : nom client, téléphone client, ou fin de l'ID
    const commandes = await Commande.find({
      commercant: req.commercantId,
      $or: [
        { 'client.nom': regex },
        { 'client.telephone': regex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(8);

    // Recherche par ID si le terme ressemble à une fin d'identifiant Mongo
    let commandeParId = [];
    if (/^[a-f0-9]{4,24}$/i.test(terme)) {
      const toutesCommandes = await Commande.find({ commercant: req.commercantId }).select('_id client total statut createdAt');
      commandeParId = toutesCommandes.filter((c) => c._id.toString().toLowerCase().includes(terme.toLowerCase()));
    }

    const commandesFusionnees = [...commandes, ...commandeParId].filter(
      (c, index, self) => self.findIndex((x) => x._id.toString() === c._id.toString()) === index
    ).slice(0, 8);

    // Recherche dans les produits
    const produits = await Produit.find({
      commercant: req.commercantId,
      nom: regex,
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      commandes: commandesFusionnees,
      produits,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { rechercherGlobal };