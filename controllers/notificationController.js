
const Notification = require('../models/Notification');
const Commercant = require('../models/Commercant');

// Créer et envoyer une notification (SuperAdmin)
const creerNotification = async (req, res) => {
  try {
    const { titre, message, cible } = req.body;

    const notification = await Notification.create({ titre, message, cible });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister l'historique des notifications envoyées (SuperAdmin)
const listerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les notifications pertinentes pour le commerçant connecté, avec statut lu/non lu
const listerMesNotifications = async (req, res) => {
  try {
    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    const cibleAutorisee = commercant.role === 'sous-compte' ? 'sous-comptes' : 'commercants';

    const notifications = await Notification.find({
      cible: { $in: ['tous', cibleAutorisee] },
    }).sort({ createdAt: -1 });

    const notificationsAvecStatut = notifications.map((n) => ({
      _id: n._id,
      titre: n.titre,
      message: n.message,
      cible: n.cible,
      createdAt: n.createdAt,
      lu: n.luPar.some((id) => id.toString() === req.commercantId.toString()),
    }));

    res.status(200).json(notificationsAvecStatut);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Marquer une notification comme lue
const marquerCommeLue = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }

    const dejaLue = notification.luPar.some((id) => id.toString() === req.commercantId.toString());

    if (!dejaLue) {
      notification.luPar.push(req.commercantId);
      await notification.save();
    }

    res.status(200).json({ message: 'Notification marquée comme lue.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerNotification, listerNotifications, listerMesNotifications, marquerCommeLue };