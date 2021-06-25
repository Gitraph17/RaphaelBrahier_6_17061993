// CONTROLEURS D'INSCRIPTION (SIGNUP) ET DE CONNEXION (LOGIN) UTILISATEUR

// Imports
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require('validator'); // Permet de contrôler à l'étape "signup" si l'email respecte un format valide et si le mot de passe est assez fort.
const jwt = require('jsonwebtoken');
require('dotenv').config();
mongoose.set('useFindAndModify', false); // Permet d'utiliser la fonction Mongoose "findOneAndUpdate" sans avertissement d'obsolescence.

// Contrôleurs

// INSCRIPTION: Vérification du format d'email, et du mot de passe qui doit être fort. Cryptage du mot de passe, création d'un nouvel objet User, puis sauvegarde dans la BDD.
exports.signup = (req, res) => {
  if (validator.isEmail(req.body.email) === false) {
    res.statusMessage = "Format d'email incorrect !";
    return res.status(400).json({ message: "Format d'email incorrect !" });
  }
  if (validator.isStrongPassword(req.body.password) === false) {
    res.statusMessage = "Format de mot de passe incorrect ! Le mot de passe doit compter au minimum 8 caractères dont au moins 1 majuscule, 1 minuscule, 1 chiffre, et 1 symbole.";
    return res.status(400).json({ message: "Format de mot de passe incorrect ! Le mot de passe doit compter au minimum 8 caractères dont au moins 1 majuscule, 1 minuscule, 1 chiffre, et 1 symbole." });
  }
  bcrypt.hash(req.body.password, 10)
      .then(hash => {
        const user = new User({
          email: req.body.email,
          password: hash,
          loginAttemptsCounter: 0
        });
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error=> res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };


/* LOGIN: Si l'email entré par l'utilisateur n'existe pas dans la BDD, un message d'erreur est envoyé.
   Si l'utilisateur entre un mot de passe invalide, le compteur de tentatives de connexion qui lui est associé est incrémenté à chaque échec, et un message d'erreur est envoyé.
   Au dela de 5 tentatives avec un mot de passe invalide, l'utilisateur ne peut plus se connecter, et un message d'erreur est envoyé.
   Si l'utilisateur entre un mot de passe valide en deça de 5 tentatives, le compteur est remis à 0.
   Si l'utilisateur se connecte avec succès, un token d'authentification lui est assigné.*/
exports.login = (req, res) => {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          res.statusMessage = "Utilisateur non trouvé !";
          return res.status(401).json({ error: "Utilisateur non trouvé" });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              User.findOneAndUpdate({ email: req.body.email }, { $inc: { loginAttemptsCounter: 1}})
                .then(user => {
                  if (user.loginAttemptsCounter < 4) {
                    res.statusMessage = `Mot de passe incorrect ! ATTENTION, il vous reste ${4 - user.loginAttemptsCounter} tentatives avant le bloquage de votre compte.`;
                    return res.status(401).json({ error: `Mot de passe incorrect !` });
                  } else {
                    res.statusMessage = `Mot de passe incorrect ! Vous avez entré 5 mots de passe invalides ou plus,  votre compte est bloqué, veuillez contacter le service client.`;
                    return res.status(401).json({ error: "Mot de passe incorrect !" });
                  }
                })
                .catch(error=> res.status(400).json({ error }));
                return
            } else if (valid && user.loginAttemptsCounter < 5) {
                User.findOneAndUpdate({ email: req.body.email }, { loginAttemptsCounter: 0})
                  .then(() => res.status(200).json({userId: user._id, token: jwt.sign({ userId: user._id }, process.env.RANDOM_TOKEN_KEY, { expiresIn: '2h' })}))
                  .catch(error=> res.status(400).json({ error }));
            } else if (valid && user.loginAttemptsCounter > 4) {
                res.statusMessage = `Vous avez entré 5 mots de passe invalides ou plus, votre compte est bloqué, veuillez contacter le service client.`;
                return res.status(401).json({ error: "Votre compte est bloqué !" });
            }
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};