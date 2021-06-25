// MIDDLEWARE GERANT LE TELECHARGEMENT, L'ENREGISTREMENT DANS LE DOSSIER "images", ET LE NOMMAGE DES PHOTOS UTILISATEURS

// Import de Multer: package qui permet de gérer les fichiers entrants dans les requêtes HTTP.
const multer = require('multer');

// Définition des types MIME d'images pour paramétrer leurs extensions dans le middleware.
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// Middleware
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');