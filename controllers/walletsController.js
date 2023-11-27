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

        if (userId !== 0 && wallet.userId !== userId) {
            throw new Error('Unauthorized access');
        }

        res.json(wallet);
    } catch (error) {
        next(error);
    }
}

async function updateWalletBalance(req, res, next) {
    try {
        const walletId = req.params.walletId;
        const wallet = await Wallet.findByPk(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const token = req.headers.authorization;
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        if (userId !== 0) {
            //send back a 401 unauthorized response
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        const { amount, type } = req.body; // get the amount and type from the request body

        if (type === 'addition') {
            wallet.setDataValue('activeBalance', wallet.getDataValue('activeBalance') + amount); // add the amount to the wallet balance if it's a credit
        } else if (type === 'subtraction') {
            if (wallet.getDataValue('activeBalance') < amount) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }
            wallet.setDataValue('activeBalance', wallet.getDataValue('activeBalance') - amount); // subtract the amount from the wallet balance if it's a deduction
        } else {
            return res.status(400).json({ message: 'Bad request' });
        }
        
        await wallet.save(); // save the updated wallet balance
        
        res.json(wallet);
    } 
    catch (error) {
        next(error);
    }

}

module.exports = {
    getUserWallets,
    getWallet,
    updateWalletBalance
};