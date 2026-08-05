const express = require('express');
const router = express.Router();
const { creerProduit, listerProduits, modifierProduit, supprimerProduit } = require('../controllers/produitController');
const { proteger } = require('../middlewares/authMiddleware');

router.use(proteger);

router.post('/', creerProduit);
router.get('/', listerProduits);
router.put('/:id', modifierProduit);
router.delete('/:id', supprimerProduit);

module.exports = router;