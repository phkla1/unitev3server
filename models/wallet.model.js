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

Wallet.belongsTo(User, { foreignKey: 'userId' });

module.exports = { Wallet };