
const express = require('express');
const router = express.Router();
const { rechercherGlobal } = require('../controllers/rechercheController');
const { proteger } = require('../middlewares/authMiddleware');

router.get('/', proteger, rechercherGlobal);

module.exports = router;