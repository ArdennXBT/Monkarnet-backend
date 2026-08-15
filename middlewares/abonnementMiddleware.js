const Commercant = require('../models/Commercant');

const verifierAbonnement = async (req, res, next) => {
  try {
    const utilisateur = await Commercant.findById(req.commercantId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    // Si c'est un sous-compte, on regarde le commerçant principal
    const commercant = utilisateur.role === 'sous-compte' && utilisateur.parentCommercant
      ? await Commercant.findById(utilisateur.parentCommercant)
      : utilisateur;

    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant principal introuvable.' });
    }

    // ========== EXCEPTION SUPERADMIN ==========
    if (commercant.role === 'superadmin' || commercant.role === 'admin') {
      return next(); // Accès total à vie
    }

    const maintenant = new Date();
    let isExpired = false;

    if (commercant.plan === 'gratuit') {
      if (maintenant > new Date(commercant.dateFinEssai)) {
        isExpired = true;
      }
    } else if (['mensuel', 'annuel'].includes(commercant.plan)) {
      if (!commercant.dateFinAbonnement || maintenant > new Date(commercant.dateFinAbonnement)) {
        isExpired = true;
      }
    }

    // Si abonnement/essai expiré
    if (isExpired) {
      // On autorise seulement les requêtes en lecture (GET)
      if (req.method === 'GET') {
        // On ajoute une info pour le frontend
        req.abonnementExpire = true;
        return next();
      }

      // Pour POST, PUT, PATCH, DELETE → on bloque
      return res.status(402).json({
        message: "Votre période d'essai est terminée. Passez à un abonnement pour continuer à utiliser cette fonctionnalité.",
        code: 'ESSAI_EXPIRE',
      });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification abonnement :', error.message);
    res.status(500).json({ message: "Erreur serveur lors de la vérification de l'abonnement." });
  }
};

module.exports = { verifierAbonnement };