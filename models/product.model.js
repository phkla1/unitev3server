const { Sequelize, dbConnection } = require('./db');
const { Seller } = require('./account.model');

const Product = dbConnection.define('product', {
    productId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    productName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    productDescription: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    },
    primaryImageUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    inventory: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});

Product.belongsTo(Seller, { foreignKey: 'sellerId' });

module.exports = { Product };