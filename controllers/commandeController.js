const Commande = require('../models/Commande');
const Produit = require('../models/Produit');

// Créer une commande
const creerCommande = async (req, res) => {
  try {
    const { client, produits, statut } = req.body;

    let total = 0;
    const lignesFinales = [];

    for (const item of produits) {
      if (item.produit) {
        // Produit du catalogue : on vérifie juste le stock, on ne le déduit pas encore
        const produit = await Produit.findOne({ _id: item.produit, commercant: req.commercantId });

        if (!produit) {
          return res.status(404).json({ message: `Produit introuvable.` });
        }

        if (produit.stock < item.quantite) {
          return res.status(400).json({ message: `Stock insuffisant pour ${produit.nom}.` });
        }

        total += item.prixUnitaire * item.quantite;

        lignesFinales.push({
          produit: item.produit,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        });
      } else if (item.nomLibre) {
        // Produit saisi librement : pas de stock à gérer
        total += item.prixUnitaire * item.quantite;

        lignesFinales.push({
          nomLibre: item.nomLibre,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        });
      } else {
        return res.status(400).json({ message: 'Chaque produit doit être choisi dans le catalogue ou saisi librement.' });
      }
    }

    // Génération du numéro de commande incrémental (CMD-0001, CMD-0002, ...)
    const dernieresCommande = await Commande.findOne({ commercant: req.commercantId })
      .sort({ createdAt: -1 })
      .select('numero');

    let prochainNumero = 1;
    if (dernieresCommande?.numero) {
      const dernierChiffre = parseInt(dernieresCommande.numero.split('-')[1], 10);
      if (!isNaN(dernierChiffre)) prochainNumero = dernierChiffre + 1;
    }
    const numero = `CMD-${String(prochainNumero).padStart(4, '0')}`;

    const commande = await Commande.create({
      commercant: req.commercantId,
      numero,
      client,
      produits: lignesFinales,
      total,
      statut,
    });

    res.status(201).json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Lister les commandes du commerçant connecté
const listerCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find({ commercant: req.commercantId })
      .populate('produits.produit', 'nom prix')
      .sort({ createdAt: -1 });

    res.status(200).json(commandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Modifier le statut d'une commande
const modifierCommande = async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.commercantId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const statutPrecedent = commande.statut;
    const nouveauStatut = req.body.statut;
    const changementStatut = nouveauStatut && nouveauStatut !== statutPrecedent;

    // Passage vers "livrée" : on déduit le stock des produits du catalogue
    if (changementStatut && nouveauStatut === 'livree' && statutPrecedent !== 'livree') {
      // 1) On vérifie d'abord que tout est disponible, avant de toucher quoi que ce soit
      for (const ligne of commande.produits) {
        if (ligne.produit) {
          const produit = await Produit.findOne({ _id: ligne.produit, commercant: req.commercantId });
          if (produit && produit.stock < ligne.quantite) {
            return res.status(400).json({
              message: `Stock insuffisant pour ${produit.nom} : il ne reste que ${produit.stock} en stock.`,
            });
          }
        }
      }

      // 2) Une fois tout validé, on déduit réellement
      for (const ligne of commande.produits) {
        if (ligne.produit) {
          const produit = await Produit.findOne({ _id: ligne.produit, commercant: req.commercantId });
          if (produit) {
            produit.stock -= ligne.quantite;
            await produit.save();
          }
        }
      }
    }

    // Si une commande livrée est repassée à un autre statut (correction), on restitue le stock
    if (changementStatut && statutPrecedent === 'livree' && nouveauStatut !== 'livree') {
      for (const ligne of commande.produits) {
        if (ligne.produit) {
          const produit = await Produit.findOne({ _id: ligne.produit, commercant: req.commercantId });
          if (produit) {
            produit.stock += ligne.quantite;
            await produit.save();
          }
        }
      }
    }

    if (req.body.statut) {
      commande.statut = req.body.statut;
    }

    await commande.save();

    res.status(200).json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Supprimer une commande
const supprimerCommande = async (req, res) => {
  try {
    const commande = await Commande.findOneAndDelete({ _id: req.params.id, commercant: req.commercantId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    res.status(200).json({ message: 'Commande supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { creerCommande, listerCommandes, modifierCommande, supprimerCommande };