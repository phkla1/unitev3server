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

const { Streets } = require('../models/location.model');

async function getStreets(req, res, next) {
    try {
        const locationId = req.params.locationId;

        const streets = await Streets.findAll({
            where: {
                locationId,
            },
        });
        res.json(streets);
    } catch (error) {
        next(error);
    }
}

async function addAddress(req, res, next) {
    try {
        const { address, locationId } = req.body;
        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        const newAddress = await Addresses.create({
            userId,
            communityId: locationId,
            streetAddress: address,
        });

        res.json(newAddress);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    addAddress,
    getAddresses,
    getStreets,
    addAddress
};