
const express = require('express');
const router = express.Router();
const { listerCommerces, getStatsGlobales, supprimerCommerce } = require('../controllers/superAdminController');
const { proteger, superAdminSeulement } = require('../middlewares/authMiddleware');

router.use(proteger, superAdminSeulement);

router.get('/commerces', listerCommerces);
router.get('/stats', getStatsGlobales);
router.delete('/commerces/:id', supprimerCommerce);

module.exports = router;