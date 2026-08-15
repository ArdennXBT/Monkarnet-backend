const axios = require('axios');
const crypto = require('crypto');
const Commercant = require('../models/Commercant');

// Prix en FCFA
const PRIX = {
  mensuel: 4200,
  annuel: 30240,
};

const SEBPAY_BASE_URL = 'https://newapi.sebpay.bj/api/v1';

const sebpayClient = axios.create({
  baseURL: SEBPAY_BASE_URL,
  headers: {
    'X-Public-Key': process.env.SEBPAY_PUBLIC_KEY,
    'X-Secret-Key': process.env.SEBPAY_SECRET_KEY,
    'Content-Type': 'application/json',
  },
});

// --- Initier un paiement d'abonnement ---
const souscrire = async (req, res) => {
  try {
    const { plan, phone, operator } = req.body; // 'mensuel' | 'annuel', numéro, opérateur (mtn, moov, orange, wav...)

    if (!['mensuel', 'annuel'].includes(plan)) {
      return res.status(400).json({ message: 'Plan invalide.' });
    }

    if (!phone || !operator) {
      return res.status(400).json({ message: 'Numéro de téléphone et opérateur requis.' });
    }

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant introuvable.' });
    }

    const montant = PRIX[plan];

    // Référence unique pour cette transaction
    const externalReference = `ORBIZO-${commercant._id}-${Date.now()}`;

    // --- Créer la collecte chez Sebpay ---
    const { data } = await sebpayClient.post('/collections', {
      amount: montant,
      currency: 'XOF',
      phone,
      operator,
      country: 'BJ',
      external_reference: externalReference,
      callback_url: `${process.env.BACKEND_URL}/api/abonnement/webhook`,
    });

    if (!data.success) {
      return res.status(400).json({ message: data.message || 'Échec de la création du paiement.' });
    }

    const transaction = data.data; // { transaction_id, status, external_reference, amount, currency, provider_link, message }

    // --- Enregistrer la transaction en attente ---
    commercant.historiquePaiements.push({
      plan,
      montant,
      transactionId: transaction.transaction_id,
      statut: 'en_attente',
    });
    await commercant.save();

    res.json({
      message: transaction.message,
      transactionId: transaction.transaction_id,
      statut: transaction.status,
      providerLink: transaction.provider_link || null, // à rediriger si présent (ex: Wave)
    });
  } catch (error) {
    console.error('Erreur souscription Sebpay :', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de l'initialisation du paiement." });
  }
};

// --- Vérifie la signature HMAC-SHA256 envoyée par Sebpay ---
const verifierSignature = (payloadBrut, signatureRecue) => {
  const signatureCalculee = crypto
    .createHmac('sha256', process.env.SEBPAY_SECRET_KEY)
    .update(payloadBrut)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureCalculee),
    Buffer.from(signatureRecue || '')
  );
};

// --- Webhook appelé automatiquement par Sebpay ---
const webhook = async (req, res) => {
  try {
    const signatureRecue = req.headers['x-sebpay-signature'];
    const payloadBrut = req.rawBody;

    if (!verifierSignature(payloadBrut, signatureRecue)) {
      console.warn('Webhook Sebpay : signature invalide, requête ignorée.');
      return res.status(401).json({ message: 'Signature invalide.' });
    }

    const {
      transaction_id: transactionId,
      external_reference: externalReference,
      status,
    } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ message: 'Données manquantes.' });
    }

    // On ne traite que les paiements confirmés
    if (status !== 'approved') {
      return res.status(200).json({ received: true }); // rejected/pending → on accuse réception sans agir
    }

    // Recherche du commerçant via la transaction stockée dans son historique
    const commercant = await Commercant.findOne({
      'historiquePaiements.transactionId': transactionId,
    });

    if (!commercant) {
      console.warn(`Webhook Sebpay : commerçant introuvable pour transaction ${transactionId}`);
      return res.status(200).json({ received: true }); // on répond 200 quand même pour éviter les retry infinis
    }

    // Idempotence : si déjà traité comme "reussi", on ne refait rien
    const paiement = commercant.historiquePaiements.find(
      (p) => p.transactionId === transactionId
    );

    if (paiement && paiement.statut === 'reussi') {
      return res.status(200).json({ received: true }); // déjà traité
    }

    const plan = paiement?.plan;
    if (!plan) {
      return res.status(200).json({ received: true });
    }

    // Met à jour le plan et la date de fin d'abonnement
    const dureeJours = plan === 'annuel' ? 365 : 30;
    commercant.plan = plan;
    commercant.dateFinAbonnement = new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000);
    commercant.rappelEssaiEnvoye = false;

    if (paiement) paiement.statut = 'reussi';

    await commercant.save();

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Sebpay :', error.message);
    res.status(500).json({ message: 'Erreur lors du traitement du webhook.' });
  }
};

// --- Vérifier le statut d'abonnement du commerçant connecté ---
const statutAbonnement = async (req, res) => {
  try {
    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant introuvable.' });
    }

    res.json({
      plan: commercant.plan,
      dateFinEssai: commercant.dateFinEssai,
      dateFinAbonnement: commercant.dateFinAbonnement,
      essaiJoursRestants: commercant.essaiJoursRestants,
      statut: commercant.statut,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du statut.' });
  }
};

// --- Vérifier manuellement le statut d'une transaction (polling frontend) ---
const verifierTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant introuvable.' });
    }

    const paiement = commercant.historiquePaiements.find(
      (p) => p.transactionId === transactionId
    );

    if (!paiement) {
      return res.status(404).json({ message: 'Transaction introuvable.' });
    }

    // Si déjà confirmé en base (via webhook), pas besoin de rappeler Sebpay
    if (paiement.statut === 'reussi') {
      return res.json({ statut: 'approved' });
    }

    // Sinon on vérifie directement auprès de Sebpay (au cas où le webhook n'est pas encore arrivé)
    const { data } = await sebpayClient.get(`/collections/${transactionId}`);
    const transaction = data.data;

    if (transaction.status === 'approved' && paiement.statut !== 'reussi') {
      // Sécurité : si le webhook a raté (ex: Render endormi), on met à jour ici aussi
      const dureeJours = paiement.plan === 'annuel' ? 365 : 30;
      commercant.plan = paiement.plan;
      commercant.dateFinAbonnement = new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000);
      commercant.rappelEssaiEnvoye = false;
      paiement.statut = 'reussi';
      await commercant.save();
    }

    res.json({ statut: transaction.status });
  } catch (error) {
    console.error('Erreur vérification transaction :', error.response?.data || error.message);
    res.status(500).json({ message: 'Erreur lors de la vérification.' });
  }
};

module.exports = { souscrire, webhook, statutAbonnement, verifierTransaction };