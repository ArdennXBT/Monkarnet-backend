const express = require('express');
const router = express.Router();
const { listerClients } = require('../controllers/clientController');
const { proteger } = require('../middlewares/authMiddleware');
const { verifierPermission } = require('../middlewares/permissionMiddleware');

router.use(proteger);
router.use(verifierPermission('clients'));

router.get('/', listerClients);

module.exports = router;