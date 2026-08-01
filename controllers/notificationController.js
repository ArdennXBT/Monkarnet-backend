
const Notification = require('../models/Notification');

// Créer et envoyer une notification
const creerNotification = async (req, res) => {
  try {
    const { titre, message, cible } = req.body;

    const notification = await Notification.create({ titre, message, cible });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister l'historique des notifications envoyées
const listerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerNotification, listerNotifications };