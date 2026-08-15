const express = require('express');
const router = express.Router();
const {
  creerSousCompte,
  listerSousComptes,
  modifierSousCompte,
  supprimerSousCompte,
} = require('../controllers/sousCompteController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

router.use(proteger);
router.use(verifierAbonnement);   // ← bloque si essai/abonnement expiré

router.post('/', creerSousCompte);
router.get('/', listerSousComptes);
router.patch('/:id', modifierSousCompte);
router.delete('/:id', supprimerSousCompte);

module.exports = router;