/* CONTROLEURS POUR LES FONCTIONS LIÉES AUX OBJETS "SAUCE":
 *    -Créer une sauce
 *    -Obtenir la liste de toutes les sauces
 *    -Obtenir une sauce particulière
 *    -Mettre à jour une sauce
 *    -Supprimer une sauce
 *    -Ajout/Retrait d'un like ou d'un dislike sur une sauce
 */
    
// Imports
const Sauce = require("../models/sauce");
const fs = require("fs"); // Gestionnaire de fichiers Node pour gérer les photos. 

// Contrôleurs
exports.createSauce = (req, res) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        likes: 0,
        dislikes: 0,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
      .then(() => res.status(201).json({ message: "Sauce enregistré !"}))
      .catch(error => res.status(400).json({ error }));
  };


exports.getAllSauces = (req, res) => {
    Sauce.find()
        .then((sauces) => {res.status(200).json(sauces)})
        .catch((error) => {res.status(400).json({error: error})});
  };

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})  
        .then((sauce) => {res.status(200).json(sauce)})
        .catch((error) => {res.status(404).json({error: error})});
};

exports.modifySauce = (req, res) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: "Sauce modifiée !"}))
      .catch(error => res.status(400).json({ error }));
};
  
exports.deleteSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({ _id: req.params.id })
              .then(() => res.status(200).json({ message: "Sauce supprimée !"}))
              .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
};

/* CONTROLEUR Like/Dislike: 
 * La sauce likée ou dislikée est récupérée sur la BDD.
 * Un objet vide "updateLikeParams" est initié, il va être rempli différement suivant si req.body.like à pour valeur 1, -1, ou 0.
 * 1 équivaut à un like, -1 à un dislike, et 0 à une annulation de like ou de dislike.
 * SI req.body.like = 0, pour déterminer si l'utilisateur à annuler un like ou un dislike, on vérifie si son identifiant se trouve déja dans le tableau des utilisateurs ayant liké, 
 * ou dans le tableau des utilisateurs ayant disliké la sauce. On modifie l'objet "updateLikeParams" en fonction.
 * Pour finir la sauce est mise à jour avec le contenu de l'objet "updateLikeParams".
 */
exports.likeDislikeSauce = (req, res) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {
        const updateLikesParams = {};
        switch (req.body.like) {
            case 1:
                updateLikesParams.$inc = {likes : 1};
                updateLikesParams.$addToSet = { usersLiked: req.body.userId };
                break;
            case -1:
                updateLikesParams.$inc = { dislikes: 1 };
                updateLikesParams.$addToSet = { usersDisliked: req.body.userId };
                break;
            case 0:
                if (sauce.usersLiked.includes(req.body.userId)){
                    updateLikesParams.$inc = { likes: -1 };
                    updateLikesParams.$pull = { usersLiked: req.body.userId };
                }else if (sauce.usersDisliked.includes(req.body.userId)){
                    updateLikesParams.$inc = { dislikes: -1 };
                    updateLikesParams.$pull = { usersDisliked: req.body.userId };
                }
                break;
        }
        Sauce.updateOne({ _id: req.params.id }, updateLikesParams)
            .then(() => res.status(200).json({message: "Like mis à jour !"}))
            .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({error}))
}