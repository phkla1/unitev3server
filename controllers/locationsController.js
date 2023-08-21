const { Addresses } = require('../models/location.model');
const { decodeToken } = require('../utils/utils');

async function addAddress(req, res, next) {
    try {
        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        const { communityId, streetAddress } = req.body;

        const address = await Addresses.create({
            userId,
            communityId,
            streetAddress,
        });

        res.json(address);
    } catch (error) {
        next(error);
    }
}

async function getAddresses(req, res, next) {
    try {
        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        const addresses = await Addresses.findAll({
            where: {
                userId,
            },
        });

        res.json(addresses);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    addAddress,
    getAddresses,
};