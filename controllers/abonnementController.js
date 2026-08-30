const axios = require('axios');
const { Webhook } = require('standardwebhooks');
const Commercant = require('../models/Commercant');

// 'test_mode' en développement, 'live_mode' en production
const DODO_ENV = process.env.DODO_ENVIRONMENT || 'test_mode';
const DODO_BASE_URL =
  DODO_ENV === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

// IDs des produits créés dans le dashboard Dodo (Produits > Créer un produit)
const PRODUIT_ID = {
  mensuel: process.env.DODO_PRODUCT_ID_MENSUEL,
  annuel: process.env.DODO_PRODUCT_ID_ANNUEL,
};

const dodoClient = axios.create({
  baseURL: DODO_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.DODO_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const webhookVerifier = new Webhook(process.env.DODO_WEBHOOK_SECRET);

// --- Initier un paiement d'abonnement : crée une session de checkout Dodo ---
const souscrire = async (req, res) => {
  try {
    const { plan } = req.body; // 'mensuel' | 'annuel'

    if (!['mensuel', 'annuel'].includes(plan)) {
      return res.status(400).json({ message: 'Plan invalide.' });
    }

    const productId = PRODUIT_ID[plan];
    if (!productId) {
      return res
        .status(500)
        .json({ message: `Aucun produit Dodo configuré pour le plan ${plan}.` });
    }

    const commercant = await Commercant.findById(req.commercantId);
    if (!commercant) {
      return res.status(404).json({ message: 'Commerçant introuvable.' });
    }

    const { data: session } = await dodoClient.post('/checkouts', {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: commercant.email,
        name: commercant.nomCommerce || commercant.nomComplet || commercant.email,
      },
      return_url: `${process.env.FRONTEND_URL}/abonnement?paiement=succes`,
      // La metadata est renvoyée telle quelle dans le webhook : c'est ainsi
      // qu'on retrouve le commerçant concerné une fois le paiement confirmé.
      metadata: {
        commercantId: commercant._id.toString(),
        plan,
      },
    });

    res.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error('Erreur souscription Dodo :', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de l'initialisation du paiement." });
  }
};

// --- Webhook appelé automatiquement par Dodo Payments ---
const webhook = async (req, res) => {
  try {
    const webhookHeaders = {
      'webhook-id': req.headers['webhook-id'],
      'webhook-signature': req.headers['webhook-signature'],
      'webhook-timestamp': req.headers['webhook-timestamp'],
    };

    const payloadBrut = req.rawBody.toString();

    // Lève une erreur si la signature est invalide → capturée par le catch plus bas
    await webhookVerifier.verify(payloadBrut, webhookHeaders);

    const event = req.body;

    // Événements qui signifient "le paiement/l'abonnement est confirmé"
    const typesReussis = ['subscription.active', 'subscription.renewed', 'payment.succeeded'];

    if (!typesReussis.includes(event.type)) {
      return res.status(200).json({ received: true }); // on accuse réception, rien à faire
    }

    const metadata = event.data?.metadata || {};
    const { commercantId, plan } = metadata;

    if (!commercantId || !plan) {
      console.warn(`Webhook Dodo : metadata incomplète pour l'événement ${event.type}`);
      return res.status(200).json({ received: true });
    }

    const commercant = await Commercant.findById(commercantId);
    if (!commercant) {
      console.warn(`Webhook Dodo : commerçant introuvable (${commercantId})`);
      return res.status(200).json({ received: true }); // 200 quand même pour éviter les retry infinis
    }

    const referenceId = event.data.subscription_id || event.data.payment_id;

    // Idempotence : si cet événement a déjà été traité comme "reussi", on ne refait rien
    const dejaTraite = commercant.historiquePaiements.some(
      (p) => p.transactionId === referenceId && p.statut === 'reussi'
    );
    if (dejaTraite) {
      return res.status(200).json({ received: true });
    }

    // Met à jour le plan et la date de fin d'abonnement
    const dureeJours = plan === 'annuel' ? 365 : 30;
    commercant.plan = plan;
    commercant.dateFinAbonnement = new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000);
    commercant.rappelEssaiEnvoye = false;

    commercant.historiquePaiements.push({
      plan,
      montant: event.data.total_amount ? event.data.total_amount / 100 : undefined,
      transactionId: referenceId,
      statut: 'reussi',
    });

    await commercant.save();

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Dodo :', error.message);
    res.status(400).json({ message: 'Signature invalide ou erreur de traitement.' });
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

module.exports = { souscrire, webhook, statutAbonnement };