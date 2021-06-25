// MODELE UTLISATEUR

// Imports
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Schéma
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  loginAttemptsCounter: {type: Number}
});

// Plugin s'assurant du caractère unique des adresses emails enregistrées dans la BDD.
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);