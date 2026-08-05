const express = require('express');
const router = express.Router();
const { creerCategorie, listerCategories, supprimerCategorie } = require('../controllers/categorieController');
const { proteger } = require('../middlewares/authMiddleware');

router.use(proteger);

router.post('/', creerCategorie);
router.get('/', listerCategories);
router.delete('/:id', supprimerCategorie);

module.exports = router;