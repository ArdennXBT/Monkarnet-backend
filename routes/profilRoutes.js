const express = require('express');
const router = express.Router();
const {
  getProfil,
  modifierProfil,
  modifierPhoto,
  demanderChangementEmail,
  confirmerChangementEmail,
  changerMotDePasse,
} = require('../controllers/profilController');
const { proteger } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary');

router.get('/', proteger, getProfil);
router.put('/', proteger, modifierProfil);
router.put('/photo', proteger, upload.single('photo'), modifierPhoto);
router.post('/demander-changement-email', proteger, demanderChangementEmail);
router.post('/confirmer-changement-email', proteger, confirmerChangementEmail);
router.put('/mot-de-passe', proteger, changerMotDePasse);

module.exports = router;