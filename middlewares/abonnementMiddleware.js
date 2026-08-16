const Commercant = require('../models/Commercant');

const verifierAbonnement = async (req, res, next) => {
  try {
    const utilisateur = await Commercant.findById(req.commercantId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    // Le SuperAdmin a toujours accès, gratuitement et à vie
    if (utilisateur.role === 'superadmin') {
      return next();
    }

    // Si c'est un sous-compte, on vérifie l'abonnement du commerçant principal
    const commercant = utilisateur.role === 'sous-compte' && utilisateur.parentCommercant
      ? await Commercant.findById(utilisateur.parentCommercant)
      : utilisateur;

    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant principal introuvable.' });
    }

    const maintenant = new Date();

    if (commercant.plan === 'gratuit') {
      if (maintenant > new Date(commercant.dateFinEssai)) {
        return res.status(402).json({
          message: "La période d'essai gratuite de 14 jours est terminée. Souscrivez à un abonnement pour continuer.",
          code: 'ESSAI_EXPIRE',
        });
      }
      return next();
    }

    if (['mensuel', 'annuel'].includes(commercant.plan)) {
      if (!commercant.dateFinAbonnement || maintenant > new Date(commercant.dateFinAbonnement)) {
        return res.status(402).json({
          message: "L'abonnement a expiré.",
          code: 'ABONNEMENT_EXPIRE',
        });
      }
      return next();
    }

    next();
  } catch (error) {
    console.error('Erreur vérification abonnement :', error.message);
    res.status(500).json({ message: "Erreur serveur lors de la vérification de l'abonnement." });
  }
};


// Bloque l'accès sauf si un abonnement PAYANT est actif (l'essai gratuit ne suffit pas)
const verifierAbonnementPayant = async (req, res, next) => {
  try {
    const utilisateur = await Commercant.findById(req.commercantId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    if (utilisateur.role === 'superadmin') {
      return next();
    }

    const commercant = utilisateur.role === 'sous-compte' && utilisateur.parentCommercant
      ? await Commercant.findById(utilisateur.parentCommercant)
      : utilisateur;

    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant principal introuvable.' });
    }

    const maintenant = new Date();
    const abonnementPayantActif =
      ['mensuel', 'annuel'].includes(commercant.plan) &&
      commercant.dateFinAbonnement &&
      maintenant <= new Date(commercant.dateFinAbonnement);

    if (!abonnementPayantActif) {
      return res.status(402).json({
        message: 'Cette fonctionnalité nécessite un abonnement actif (mensuel ou annuel).',
        code: 'ABONNEMENT_PAYANT_REQUIS',
      });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification abonnement payant :', error.message);
    res.status(500).json({ message: "Erreur serveur lors de la vérification de l'abonnement." });
  }
};

module.exports = { verifierAbonnement, verifierAbonnementPayant };
