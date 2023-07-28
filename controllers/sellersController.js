const { Seller } = require('../models/account.model');

// Create a new seller
exports.createSeller = async (req, res, next) => {
    const newSeller = {
        userId: req.body.userId,
        businessName: req.body.businessName,
        businessEmail: req.body.businessEmail,
        businessPhone: req.body.businessPhone
    };
    Seller.create(newSeller)
        .then((seller) => {
            res.status(201).json(seller);
        })
        .catch((error) => {
            console.error('Unable to create seller: ', error);
            res.sendStatus(500);
        });
}

// Get all sellers
exports.getAllSellers = async (req, res, next) => {
    Seller.findAll()
        .then((sellers) => {
            res.status(200).json(sellers);
        })
        .catch((error) => {
            console.error('Unable to get sellers: ', error);
            res.sendStatus(500);
        });
}

// Get a single seller by ID
exports.getSellerById = async (req, res, next) => {
    const sellerId = req.params.id;
    Seller.findByPk(sellerId)
        .then((seller) => {
            if (seller) {
                res.status(200).json(seller);
            } else {
                res.sendStatus(404);
            }
        })
        .catch((error) => {
            console.error('Unable to get seller: ', error);
            res.sendStatus(500);
        });
}

// Update a seller by ID
exports.updateSellerById = async (req, res, next) => {
    const sellerId = req.params.id;
    const updatedSeller = {
        businessName: req.body.businessName,
        businessEmail: req.body.businessEmail,
        businessPhone: req.body.businessPhone
    };
    Seller.update(updatedSeller, { where: { id: sellerId } })
        .then((result) => {
            if (result[0] === 1) {
                res.sendStatus(204);
            } else {
                res.sendStatus(404);
            }
        })
        .catch((error) => {
            console.error('Unable to update seller: ', error);
            res.sendStatus(500);
        });
}

// Delete a seller by ID
exports.deleteSellerById = async (req, res, next) => {
    const sellerId = req.params.id;
    Seller.destroy({ where: { id: sellerId } })
        .then((result) => {
            if (result === 1) {
                res.sendStatus(204);
            } else {
                res.sendStatus(404);
            }
        })
        .catch((error) => {
            console.error('Unable to delete seller: ', error);
            res.sendStatus(500);
        });
}