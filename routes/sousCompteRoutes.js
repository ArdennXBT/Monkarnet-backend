const express = require('express');
const router = express.Router();
const {
  creerSousCompte,
  listerSousComptes,
  modifierSousCompte,
  supprimerSousCompte,
} = require('../controllers/sousCompteController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierAbonnementPayant } = require('../middlewares/abonnementMiddleware');

router.use(proteger);
router.use(verifierAbonnementPayant);   // ← bloque même pendant l'essai gratuit

router.post('/', creerSousCompte);
router.get('/', listerSousComptes);
router.patch('/:id', modifierSousCompte);
router.delete('/:id', supprimerSousCompte);

module.exports = router;