const express = require('express');
const router = express.Router();
const { souscrire, webhook, statutAbonnement, verifierTransaction } = require('../controllers/abonnementController');
const { proteger } = require('../middlewares/authMiddleware');

router.post('/souscrire', proteger, souscrire);
router.get('/statut', proteger, statutAbonnement);
router.get('/transaction/:transactionId', proteger, verifierTransaction);
router.post('/webhook', webhook); // pas de "proteger" : appelé directement par Sebpay

module.exports = router;