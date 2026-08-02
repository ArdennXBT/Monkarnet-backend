
const express = require('express');
const router = express.Router();
const { creerNotification, listerNotifications, listerMesNotifications, marquerCommeLue } = require('../controllers/notificationController');
const { proteger, superAdminSeulement } = require('../middlewares/authMiddleware');

// Routes pour tout commerçant connecté
router.get('/mes-notifications', proteger, listerMesNotifications);
router.put('/:id/lire', proteger, marquerCommeLue);

// Routes réservées au SuperAdmin
router.use(proteger, superAdminSeulement);
router.post('/', creerNotification);
router.get('/', listerNotifications);

module.exports = router;