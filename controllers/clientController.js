
const mongoose = require('mongoose');
const Commande = require('../models/Commande');

const listerClients = async (req, res) => {
  try {
    const commercantId = new mongoose.Types.ObjectId(req.commercantId);

    const clients = await Commande.aggregate([
      { $match: { commercant: commercantId } },
      {
        $group: {
          _id: '$client.telephone',
          nom: { $last: '$client.nom' },
          telephone: { $last: '$client.telephone' },
          adresse: { $last: '$client.adresse' },
          nombreCommandes: { $sum: 1 },
          totalDepense: { $sum: '$total' },
          derniereCommande: { $max: '$createdAt' },
        },
      },
      { $sort: { derniereCommande: -1 } },
    ]);

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { listerClients };