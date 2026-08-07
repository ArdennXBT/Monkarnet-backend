const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Commercant = require('../models/Commercant');
const { envoyerCodeVerification } = require('../utils/envoyerEmail');

const genererCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Inscription
const inscrire = async (req, res) => {
  try {
    const { nomComplet, email, motDePasse, nomCommerce, typeCommerce, adresse, telephone } = req.body;

    const commercantExistant = await Commercant.findOne({ email });
    if (commercantExistant) {
      return res.status(400).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const motDePasseHash = await bcrypt.hash(motDePasse, salt);

    const code = genererCode();

    const commercant = await Commercant.create({
      nomComplet,
      email,
      motDePasse: motDePasseHash,
      nomCommerce,
      typeCommerce,
      adresse,
      telephone,
      emailVerifie: false,
      codeVerification: code,
      codeVerificationExpire: new Date(Date.now() + 15 * 60 * 1000),
    });

    await envoyerCodeVerification(email, nomComplet, code);

    res.status(201).json({
      message: 'Compte créé. Vérifiez votre email pour confirmer votre compte.',
      email: commercant.email,
      besoinVerification: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Vérifier le code reçu par email
const verifierEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const commercant = await Commercant.findOne({ email });
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    if (commercant.emailVerifie) {
      return res.status(400).json({ message: 'Ce compte est déjà vérifié.' });
    }

    if (commercant.codeVerification !== code) {
      return res.status(400).json({ message: 'Code incorrect.' });
    }

    if (new Date() > commercant.codeVerificationExpire) {
      return res.status(400).json({ message: 'Ce code a expiré. Demandez-en un nouveau.' });
    }

    commercant.emailVerifie = true;
    commercant.codeVerification = null;
    commercant.codeVerificationExpire = null;
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
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Renvoyer un nouveau code
const renvoyerCode = async (req, res) => {
  try {
    const { email } = req.body;

    const commercant = await Commercant.findOne({ email });
    if (!commercant) {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    if (commercant.emailVerifie) {
      return res.status(400).json({ message: 'Ce compte est déjà vérifié.' });
    }

    const code = genererCode();
    commercant.codeVerification = code;
    commercant.codeVerificationExpire = new Date(Date.now() + 15 * 60 * 1000);
    await commercant.save();

    await envoyerCodeVerification(email, commercant.nomComplet, code);

    res.status(200).json({ message: 'Un nouveau code a été envoyé.' });
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

    if (!commercant.emailVerifie) {
      return res.status(403).json({
        message: 'Veuillez vérifier votre email avant de vous connecter.',
        besoinVerification: true,
        email: commercant.email,
      });
    }

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

// Connexion / inscription via Google (email déjà vérifié par Google)
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
      const motDePasseAleatoire = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      commercant = await Commercant.create({
        nomComplet: name,
        email,
        motDePasse: motDePasseAleatoire,
        nomCommerce: `${name} - Commerce`,
        emailVerifie: true, // Google a déjà vérifié l'email
      });
    } else if (!commercant.emailVerifie) {
      commercant.emailVerifie = true;
    }

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

module.exports = { inscrire, connecter, connecterGoogle, verifierEmail, renvoyerCode };