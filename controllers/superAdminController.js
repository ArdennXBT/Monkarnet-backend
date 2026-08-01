
const Commercant = require('../models/Commercant');
const Commande = require('../models/Commande');

// Liste de tous les commerces (commerçants principaux uniquement)
const listerCommerces = async (req, res) => {
  try {
    const commerces = await Commercant.find({ role: 'commercant' })
      .select('-motDePasse')
      .sort({ createdAt: -1 });

    res.status(200).json(commerces);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Statistiques globales de la plateforme
const getStatsGlobales = async (req, res) => {
  try {
    const totalCommerces = await Commercant.countDocuments({ role: 'commercant' });
    const totalSousComptes = await Commercant.countDocuments({ role: 'sous-compte' });
    const totalCommandes = await Commande.countDocuments();

    const resultatCA = await Commande.aggregate([
      { $match: { statut: { $ne: 'annulee' } } },
      { $group: { _id: null, totalCA: { $sum: '$total' } } },
    ]);

    const totalCA = resultatCA[0]?.totalCA || 0;

    res.status(200).json({
      totalCommerces,
      totalSousComptes,
      totalCommandes,
      totalCA,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer un commerce (et ses sous-comptes)
const supprimerCommerce = async (req, res) => {
  try {
    const commerce = await Commercant.findOne({ _id: req.params.id, role: 'commercant' });

    if (!commerce) {
      return res.status(404).json({ message: 'Commerce introuvable.' });
    }

    await Commercant.deleteMany({ parentCommercant: commerce._id });
    await commerce.deleteOne();

    res.status(200).json({ message: 'Commerce supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { listerCommerces, getStatsGlobales, supprimerCommerce };