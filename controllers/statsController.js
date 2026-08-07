const mongoose = require('mongoose');
const Commande = require('../models/Commande');
const Produit = require('../models/Produit');

const getStats = async (req, res) => {
  try {
    const commercantId = new mongoose.Types.ObjectId(req.commercantId);

    const maintenant = new Date();
    const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const debutSemaine = new Date(debutJour);
    debutSemaine.setDate(debutJour.getDate() - debutJour.getDay());
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debutAnnee = new Date(maintenant.getFullYear(), 0, 1);

    const calculerPeriode = async (dateDebut) => {
      const resultat = await Commande.aggregate([
        {
          $match: {
            commercant: commercantId,
            createdAt: { $gte: dateDebut },
            statut: { $ne: 'annulee' },
          },
        },
        {
          $group: {
            _id: null,
            totalCA: { $sum: '$total' },
            nombreCommandes: { $sum: 1 },
          },
        },
      ]);

      return resultat[0] || { totalCA: 0, nombreCommandes: 0 };
    };

    // Produit le plus vendu (en quantité) du mois en cours
    const calculerTopProduit = async () => {
      const resultat = await Commande.aggregate([
        {
          $match: {
            commercant: commercantId,
            createdAt: { $gte: debutMois },
            statut: { $ne: 'annulee' },
          },
        },
        { $unwind: '$produits' },
        {
          $group: {
            _id: {
              produit: '$produits.produit',
              nomLibre: '$produits.nomLibre',
            },
            quantiteVendue: { $sum: '$produits.quantite' },
          },
        },
        { $sort: { quantiteVendue: -1 } },
        { $limit: 1 },
      ]);

      if (resultat.length === 0) return null;

      const top = resultat[0];

      if (top._id.produit) {
        const produit = await Produit.findById(top._id.produit).select('nom image prix');
        if (produit) {
          return {
            nom: produit.nom,
            image: produit.image,
            prix: produit.prix,
            quantiteVendue: top.quantiteVendue,
          };
        }
      }

      // Produit "libre" (sans fiche produit associée)
      return {
        nom: top._id.nomLibre || 'Produit',
        image: '',
        prix: null,
        quantiteVendue: top.quantiteVendue,
      };
    };

    const [statsJour, statsSemaine, statsMois, statsAnnee, topProduit] = await Promise.all([
      calculerPeriode(debutJour),
      calculerPeriode(debutSemaine),
      calculerPeriode(debutMois),
      calculerPeriode(debutAnnee),
      calculerTopProduit(),
    ]);

    res.status(200).json({
      jour: statsJour,
      semaine: statsSemaine,
      mois: statsMois,
      annee: statsAnnee,
      topProduit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Données du graphique selon la période
const getChartData = async (req, res) => {
  try {
    const commercantId = new mongoose.Types.ObjectId(req.commercantId);
    const periode = req.query.periode || 'jour';
    const maintenant = new Date();

    let dateDebut;
    let groupBy;
    let labelsOrdre;

    if (periode === 'jour') {
      dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
      groupBy = { $multiply: [{ $floor: { $divide: [{ $hour: '$createdAt' }, 4] } }, 4] };
      labelsOrdre = [0, 4, 8, 12, 16, 20];
    } else if (periode === 'semaine') {
      dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - maintenant.getDay());
      groupBy = { $dayOfWeek: '$createdAt' };
      labelsOrdre = [2, 3, 4, 5, 6, 7, 1];
    } else if (periode === 'mois') {
      dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      groupBy = { $ceil: { $divide: [{ $dayOfMonth: '$createdAt' }, 7] } };
      labelsOrdre = [1, 2, 3, 4, 5];
    } else {
      dateDebut = new Date(maintenant.getFullYear(), 0, 1);
      groupBy = { $month: '$createdAt' };
      labelsOrdre = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    const resultats = await Commande.aggregate([
      {
        $match: {
          commercant: commercantId,
          createdAt: { $gte: dateDebut },
          statut: { $ne: 'annulee' },
        },
      },
      {
        $group: {
          _id: groupBy,
          ca: { $sum: '$total' },
          commandes: { $sum: 1 },
        },
      },
    ]);

    const dico = {};
    resultats.forEach((r) => {
      dico[r._id] = { ca: r.ca, commandes: r.commandes };
    });

    const nomsJours = { 1: 'Dim', 2: 'Lun', 3: 'Mar', 4: 'Mer', 5: 'Jeu', 6: 'Ven', 7: 'Sam' };
    const nomsMois = { 1: 'Jan', 2: 'Fév', 3: 'Mar', 4: 'Avr', 5: 'Mai', 6: 'Jun', 7: 'Jul', 8: 'Aoû', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Déc' };

    const donnees = labelsOrdre.map((cle) => {
      let label;
      if (periode === 'jour') label = `${cle}h`;
      else if (periode === 'semaine') label = nomsJours[cle];
      else if (periode === 'mois') label = `Sem ${cle}`;
      else label = nomsMois[cle];

      const valeurs = dico[cle] || { ca: 0, commandes: 0 };
      return { label, ca: valeurs.ca, commandes: valeurs.commandes };
    });

    res.status(200).json(donnees);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getStats, getChartData };