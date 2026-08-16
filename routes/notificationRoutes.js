const express = require('express');
const router = express.Router();
const { creerNotification, listerNotifications, listerMesNotifications, marquerCommeLue } = require('../controllers/notificationController');
const { proteger, superAdminSeulement } = require('../middlewares/authMiddleware');

router.get('/mes-notifications', proteger, listerMesNotifications);
router.put('/:id/lire', proteger, marquerCommeLue);

router.use(proteger, superAdminSeulement);
router.post('/', creerNotification);
router.get('/', listerNotifications);

module.exports = router;