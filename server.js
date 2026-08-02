
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


connectDB();

const app = express();

app.use(cors());
app.use(express.json());
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


app.get('/', (req, res) => {
  res.send('API Monkarnet en ligne');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});