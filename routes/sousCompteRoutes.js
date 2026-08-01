
const express = require('express');
const router = express.Router();
const { creerSousCompte, listerSousComptes, supprimerSousCompte } = require('../controllers/sousCompteController');
const { proteger } = require('../middlewares/authMiddleware');

router.use(proteger);

router.post('/', creerSousCompte);
router.get('/', listerSousComptes);
router.delete('/:id', supprimerSousCompte);

module.exports = router;