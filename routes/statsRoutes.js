const express = require('express');
const router = express.Router();
const { getStats, getChartData } = require('../controllers/statsController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

router.get('/', proteger, verifierAbonnement, getStats);
router.get('/chart', proteger, verifierAbonnement, getChartData);

module.exports = router;