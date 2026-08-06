const express = require('express');
const router = express.Router();
const {
  creerProduit,
  listerProduits,
  modifierProduit,
  supprimerProduit,
  creerCategorie,
  listerCategories,
  supprimerCategorie,
} = require('../controllers/produitController');
const { proteger } = require('../middlewares/authMiddleware');

router.use(proteger);

// Produits
router.post('/', creerProduit);
router.get('/', listerProduits);
router.put('/:id', modifierProduit);
router.delete('/:id', supprimerProduit);

// Catégories
router.post('/categories', creerCategorie);
router.get('/categories', listerCategories);
router.delete('/categories/:id', supprimerCategorie);

module.exports = router;