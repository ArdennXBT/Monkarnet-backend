const express = require('express');
const router = express.Router();
const { souscrire, webhook, statutAbonnement } = require('../controllers/abonnementController');
const { proteger } = require('../middlewares/authMiddleware');

router.post('/souscrire', proteger, souscrire);
router.get('/statut', proteger, statutAbonnement);
router.post('/webhook', webhook); // pas de "proteger" : appelé directement par Dodo Payments

module.exports = router;