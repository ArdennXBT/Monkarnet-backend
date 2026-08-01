
const express = require('express');
const router = express.Router();
const { listerClients } = require('../controllers/clientController');
const { proteger } = require('../middlewares/authMiddleware');

router.get('/', proteger, listerClients);

module.exports = router;