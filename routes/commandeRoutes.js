
const express = require('express');
const router = express.Router();
const { creerCommande, listerCommandes, modifierCommande, supprimerCommande } = require('../controllers/commandeController');
const { proteger } = require('../middlewares/authMiddleware');

router.use(proteger);

router.post('/', creerCommande);
router.get('/', listerCommandes);
router.put('/:id', modifierCommande);
router.delete('/:id', supprimerCommande);

module.exports = router;