const { Wallet } = require('../models/wallet.model');
const { decodeToken } = require('../utils/utils');

async function getUserWallets(req, res, next) {
    try {
        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        const wallets = await Wallet.findAll({
            where: {
                userId,
            },
        });

        res.json(wallets);
    } catch (error) {
        next(error);
    }
}

async function getWallet(req, res, next) {
    try {
        const walletId = req.params.walletId;
        const wallet = await Wallet.findByPk(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        if (userId !== 0 || wallet.userId !== userId) {
            throw new Error('Unauthorized access');
        }

        res.json(wallet);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUserWallets,
    getWallet,
};