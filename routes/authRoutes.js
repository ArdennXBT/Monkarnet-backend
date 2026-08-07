const express = require('express');
const router = express.Router();
const {
  inscrire,
  connecter,
  connecterGoogle,
  verifierEmail,
  renvoyerCode,
} = require('../controllers/authController');

router.post('/inscription', inscrire);
router.post('/connexion', connecter);
router.post('/google', connecterGoogle);
router.post('/verifier-email', verifierEmail);
router.post('/renvoyer-code', renvoyerCode);

module.exports = router;