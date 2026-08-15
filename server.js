const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const produitRoutes = require('./routes/produitRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const statsRoutes = require('./routes/statsRoutes');
const sousCompteRoutes = require('./routes/sousCompteRoutes');
const clientRoutes = require('./routes/clientRoutes');
const profilRoutes = require('./routes/profilRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const rechercheRoutes = require('./routes/rechercheRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');

connectDB();

const app = express();

app.use(cors());

// On capture le body brut (rawBody) pendant le parsing JSON,
// nécessaire pour vérifier la signature HMAC des webhooks Sebpay
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sous-comptes', sousCompteRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/profil', profilRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recherche', rechercheRoutes);
app.use('/api/abonnement', abonnementRoutes);

app.get('/', (req, res) => {
  res.send('API Monkarnet en ligne');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});