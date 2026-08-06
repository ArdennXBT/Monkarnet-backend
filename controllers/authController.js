const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Commercant = require('../models/Commercant');

// Inscription
const inscrire = async (req, res) => {
  try {
    const { nomComplet, email, motDePasse, nomCommerce, typeCommerce, adresse, telephone } = req.body;

    // Vérifier si l'email existe déjà
    const commercantExistant = await Commercant.findOne({ email });
    if (commercantExistant) {
      return res.status(400).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const motDePasseHash = await bcrypt.hash(motDePasse, salt);

    // Créer le commerçant
    const commercant = await Commercant.create({
      nomComplet,
      email,
      motDePasse: motDePasseHash,
      nomCommerce,
      typeCommerce,
      adresse,
      telephone,
    });

    // Générer le token JWT
    const token = jwt.sign({ id: commercant._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      _id: commercant._id,
      nomComplet: commercant.nomComplet,
      email: commercant.email,
      nomCommerce: commercant.nomCommerce,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Connexion
const connecter = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const commercant = await Commercant.findOne({ email });
    if (!commercant) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, commercant.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Met à jour la dernière connexion et journalise l'événement si c'est un sous-compte
    commercant.derniereConnexion = new Date();
    if (commercant.role === 'sous-compte') {
      commercant.activites.unshift({ description: 'Connexion au compte', date: new Date() });
      commercant.activites = commercant.activites.slice(0, 20);
    }
    await commercant.save();

    const token = jwt.sign({ id: commercant._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      _id: commercant._id,
      nomComplet: commercant.nomComplet,
      email: commercant.email,
      nomCommerce: commercant.nomCommerce,
      role: commercant.role,
      roleSousCompte: commercant.roleSousCompte,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Connexion / inscription via Google
const connecterGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let commercant = await Commercant.findOne({ email });

    if (!commercant) {
      // Création d'un nouveau compte via Google
      const motDePasseAleatoire = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      commercant = await Commercant.create({
        nomComplet: name,
        email,
        motDePasse: motDePasseAleatoire,
        nomCommerce: `${name} - Commerce`,
      });
    }

    // Mise à jour dernière connexion + activité (même logique que la connexion classique)
    commercant.derniereConnexion = new Date();
    if (commercant.role === 'sous-compte') {
      commercant.activites.unshift({ description: 'Connexion au compte (Google)', date: new Date() });
      commercant.activites = commercant.activites.slice(0, 20);
    }
    await commercant.save();

    const token = jwt.sign({ id: commercant._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      _id: commercant._id,
      nomComplet: commercant.nomComplet,
      email: commercant.email,
      nomCommerce: commercant.nomCommerce,
      role: commercant.role,
      roleSousCompte: commercant.roleSousCompte,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de connexion Google.', error: error.message });
  }
};

module.exports = { inscrire, connecter, connecterGoogle };