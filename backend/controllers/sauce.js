const Sauce = require("../models/sauce");

const fs = require("fs");
const { cpuUsage } = require("process");
const sauce = require("../models/sauce");

exports.createSauce = (req, res, next) => {
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


exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => {res.status(200).json(sauces)})
        .catch((error) => {res.status(400).json({error: error})});
  };

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})  
        .then((sauce) => {res.status(200).json(sauce)})
        .catch((error) => {res.status(404).json({error: error})});
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: "Sauce modifiée !"}))
      .catch(error => res.status(400).json({ error }));
};
  
exports.deleteSauce = (req, res, next) => {
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

exports.likeDislikeSauce = (req, res, next) => {
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
        Sauce.updateOne({ _id: req.params.id }, { ...updateLikesParams})
        .then(() => res.status(200).json({message: "Like mis à jour !"}))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({error}))
}