const express = require('express');
const router = express.Router();
const {
  inscrire,
  connecter,
  connecterGoogle,
  verifierEmail,
  renvoyerCode,
  motDePasseOublie,
  reinitialiserMotDePasse,
} = require('../controllers/authController');

router.post('/inscription', inscrire);
router.post('/connexion', connecter);
router.post('/google', connecterGoogle);
router.post('/verifier-email', verifierEmail);
router.post('/renvoyer-code', renvoyerCode);
router.post('/mot-de-passe-oublie', motDePasseOublie);
router.post('/reinitialiser-mot-de-passe', reinitialiserMotDePasse);

module.exports = router;