
const express = require('express');
const router = express.Router();
const { getStats, getChartData } = require('../controllers/statsController');
const { proteger } = require('../middlewares/authMiddleware');

router.get('/', proteger, getStats);
router.get('/chart', proteger, getChartData);

module.exports = router;