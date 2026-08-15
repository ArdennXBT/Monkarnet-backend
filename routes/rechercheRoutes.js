const express = require('express');
const router = express.Router();
const { rechercherGlobal } = require('../controllers/rechercheController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

router.get('/', proteger, verifierAbonnement, rechercherGlobal);

module.exports = router;