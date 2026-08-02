
const express = require('express');
const router = express.Router();
const { getProfil, modifierProfil, modifierPhoto } = require('../controllers/profilController');
const { proteger } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary');

router.get('/', proteger, getProfil);
router.put('/', proteger, modifierProfil);
router.put('/photo', proteger, upload.single('photo'), modifierPhoto);

module.exports = router;