const Commercant = require('../models/Commercant');

const PERMISSIONS = {
  admin: ['dashboard', 'commandes', 'produits', 'clients'],
  vendeur: ['dashboard', 'commandes', 'produits', 'clients'],
  comptable: ['dashboard', 'commandes', 'clients'],
  livreur: ['commandes'],
};

const verifierPermission = (module) => {
  return async (req, res, next) => {
    try {
      const utilisateur = await Commercant.findById(req.commercantId);

      if (!utilisateur) {
        return res.status(401).json({ message: 'Utilisateur introuvable.' });
      }

      // Le compte principal et le superadmin ont toujours accès à tout
      if (utilisateur.role === 'commercant' || utilisateur.role === 'superadmin') {
        return next();
      }

      const permissions = PERMISSIONS[utilisateur.roleSousCompte] || [];

      if (!permissions.includes(module)) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette section." });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
  };
};

module.exports = { verifierPermission, PERMISSIONS };