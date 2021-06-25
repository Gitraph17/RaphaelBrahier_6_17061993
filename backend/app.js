// APPLICATION EXPRESS

// Imports
const express = require("express");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
require('dotenv').config()
const path = require("path");
const xss = require("xss-clean");
const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}.l6j34.mongodb.net/SoPekockoDatabase?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// Helmet définit des en-têtes HTTP liées à la sécurité
app.use(helmet());

// Déinition des en-têtes HTTP CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE,');
    next();
  });

// Parseur de données JSON
app.use(express.json());

// Permet de filtrer les injection de code visant la BDD Mongo
app.use(mongoSanitize());

// Permet de filtrer les attaques XSS
app.use(xss());

// Indique à Express qu'il faut gérer la ressource images de manière statique pour les requêtes vers la route /images
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes "générales" de l'application
app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;