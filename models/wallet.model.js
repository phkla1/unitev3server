const {Sequelize, dbConnection} = require('./db');
const { User } = require('./account.model');

const Wallet = dbConnection.define('wallet', {
    walletId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    activeBalance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    pendingBalance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    bankAccountNumber: {
        type: Sequelize.STRING,
        allowNull: true,
    },
},{
    hooks : {
        beforeCreate : (record, options) => {
            record.dataValues.createdAt = Date.now();
            record.dataValues.updatedAt = Date.now();
        },
        beforeUpdate : (record, options) => {
            record.dataValues.updatedAt = Date.now();
        }
    }
});

const WalletTransaction = dbConnection.define('wallettransaction', {
    transferId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId',
        },
    },
    fromWalletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'wallets', 
            key: 'walletId', 
        },
    },
    toWalletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'wallets', 
            key: 'walletId', 
        },
    },
    transactionType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    createdAt: {
        allowNull: false,
        type: Sequelize.DATE
    },
    updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
    }
},{
    hooks : {
        beforeCreate : (record, options) => {
            record.dataValues.createdAt = Date.now();
            record.dataValues.updatedAt = Date.now();
        },
        beforeUpdate : (record, options) => {
            record.dataValues.updatedAt = Date.now();
        }
    }
});

Wallet.belongsTo(User, { foreignKey: 'userId' });

module.exports = { Wallet, WalletTransaction };