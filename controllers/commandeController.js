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

// Modifier une commande (statut seul, ou édition complète client + produits)
const modifierCommande = async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.commercantId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const { client, produits, statut } = req.body;

    // ===== Cas 1 : édition complète (client + produits) =====
    if (produits) {
      let total = 0;
      const lignesFinales = [];

      for (const item of produits) {
        if (item.produit) {
          const produit = await Produit.findOne({ _id: item.produit, commercant: req.commercantId });
          if (!produit) {
            return res.status(404).json({ message: `Produit introuvable.` });
          }
          total += item.prixUnitaire * item.quantite;
          lignesFinales.push({
            produit: item.produit,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
          });
        } else if (item.nomLibre) {
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

      // Si la commande était déjà livrée : on restitue l'ancien stock, puis on déduit le nouveau
      if (commande.statut === 'livree') {
        for (const ancienneLigne of commande.produits) {
          if (ancienneLigne.produit) {
            const produit = await Produit.findOne({ _id: ancienneLigne.produit, commercant: req.commercantId });
            if (produit) {
              produit.stock += ancienneLigne.quantite;
              await produit.save();
            }
          }
        }

        for (const ligne of lignesFinales) {
          if (ligne.produit) {
            const produit = await Produit.findOne({ _id: ligne.produit, commercant: req.commercantId });
            if (produit && produit.stock < ligne.quantite) {
              return res.status(400).json({
                message: `Stock insuffisant pour ${produit.nom} : il ne reste que ${produit.stock} en stock.`,
              });
            }
          }
        }

        for (const ligne of lignesFinales) {
          if (ligne.produit) {
            const produit = await Produit.findOne({ _id: ligne.produit, commercant: req.commercantId });
            if (produit) {
              produit.stock -= ligne.quantite;
              await produit.save();
            }
          }
        }
      }

      commande.produits = lignesFinales;
      commande.total = total;
    }

    if (client) {
      commande.client = client;
    }

    // ===== Cas 2 : changement de statut =====
    const statutPrecedent = commande.statut;
    const changementStatut = statut && statut !== statutPrecedent;

    if (changementStatut && statut === 'livree' && statutPrecedent !== 'livree') {
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

    if (changementStatut && statutPrecedent === 'livree' && statut !== 'livree') {
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

    if (statut) {
      commande.statut = statut;
    }

    await commande.save();

    const commandePopulee = await Commande.findById(commande._id).populate('produits.produit', 'nom prix');

    res.status(200).json(commandePopulee);
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