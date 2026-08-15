const express = require('express');
const router = express.Router();
const { creerCommande, listerCommandes, modifierCommande, supprimerCommande } = require('../controllers/commandeController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierPermission } = require('../middlewares/permissionMiddleware');
const { verifierAbonnement } = require('../middlewares/abonnementMiddleware');

router.use(proteger);
router.use(verifierAbonnement);                // ← bloque si essai/abonnement expiré
router.use(verifierPermission('commandes'));   // ← ajouté ici

router.post('/', creerCommande);
router.get('/', listerCommandes);
router.put('/:id', modifierCommande);
router.delete('/:id', supprimerCommande);

module.exports = router;