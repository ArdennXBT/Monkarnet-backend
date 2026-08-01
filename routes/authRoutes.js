
const express = require('express');
const router = express.Router();
const { inscrire, connecter, connecterGoogle } = require('../controllers/authController');

router.post('/inscription', inscrire);
router.post('/connexion', connecter);
router.post('/google', connecterGoogle);

module.exports = router;