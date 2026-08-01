
const express = require('express');
const router = express.Router();
const { getProfil, modifierProfil } = require('../controllers/profilController');
const { proteger } = require('../middlewares/authMiddleware');

router.get('/', proteger, getProfil);
router.put('/', proteger, modifierProfil);

module.exports = router;