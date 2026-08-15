const express = require('express');
const router = express.Router();
const { listerClients } = require('../controllers/clientController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierPermission } = require('../middlewares/permissionMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

router.use(proteger);
router.use(verifierAbonnement);   // ← bloque si essai/abonnement expiré
router.use(verifierPermission('clients'));

router.get('/', listerClients);

module.exports = router;