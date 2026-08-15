const express = require('express');
const router = express.Router();
const { creerNotification, listerNotifications, listerMesNotifications, marquerCommeLue } = require('../controllers/notificationController');
const { proteger, superAdminSeulement } = require('../middlewares/authMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

// Routes pour tout commerçant connecté
router.get('/mes-notifications', proteger, verifierAbonnement, listerMesNotifications);
router.put('/:id/lire', proteger, verifierAbonnement, marquerCommeLue);

// Routes réservées au SuperAdmin
router.use(proteger, superAdminSeulement);
router.post('/', creerNotification);
router.get('/', listerNotifications);

module.exports = router;