
const jwt = require('jsonwebtoken');
const Commercant = require('../models/Commercant');

const proteger = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.commercantId = decoded.id;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token invalide.' });
    }
  } else {
    res.status(401).json({ message: 'Non autorisé, aucun token.' });
  }
};


const superAdminSeulement = async (req, res, next) => {
  try {
    const commercant = await Commercant.findById(req.commercantId);

    if (!commercant || commercant.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accès réservé au SuperAdmin.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
module.exports = { proteger, superAdminSeulement };