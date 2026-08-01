
const express = require('express');
const router = express.Router();
const { creerNotification, listerNotifications } = require('../controllers/notificationController');
const { proteger, superAdminSeulement } = require('../middlewares/authMiddleware');

// Route pour tout commerçant connecté : voir les notifications
router.get('/mes-notifications', proteger, listerNotifications);

// Routes réservées au SuperAdmin
router.use(proteger, superAdminSeulement);
router.post('/', creerNotification);
router.get('/', listerNotifications);

module.exports = router;