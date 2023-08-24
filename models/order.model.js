const { Sequelize, dbConnection } = require('./db');
const { Product } = require('./product.model');
const { User } = require('./account.model');

// define the Order model
const Order = dbConnection.define('Order', {
	orderId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	addressId: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	orderDate: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	total: {
		type: Sequelize.DECIMAL(10, 2),
		allowNull: false
	},
	status: {
		type: Sequelize.ENUM('unpaid', 'paid'),
		allowNull: false,
		defaultValue: 'unpaid'
	},
	unitePaymentRef: {
		type: Sequelize.STRING,
		allowNull: true,
		unique: true
	},
	gatewayPaymentRef: {
		type: Sequelize.STRING,
		allowNull: true,
		unique: true
	},
	chargedAmount: {
		type: Sequelize.DECIMAL(10, 2),
		allowNull: true
	},
	settledAmount: {
		type: Sequelize.DECIMAL(10, 2),
		allowNull: true
	},
	gatewayFee: {
		type: Sequelize.DECIMAL(10, 2),
		allowNull: true
	},
	paymentType: {
		type: Sequelize.STRING,
		allowNull: true
	}}, {
	hooks: {
		beforeCreate: (record, options) => {
			record.dataValues.createdAt = Date.now();
			record.dataValues.updatedAt = Date.now();
		},
		beforeUpdate: (record, options) => {
			record.dataValues.updatedAt = Date.now();
		}
	}
});

// define the OrderItem model
const OrderItem = dbConnection.define('OrderItem', {
	itemId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	quantity: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	price: {
		type: Sequelize.DECIMAL(10, 2),
		allowNull: false
	}
});

// define the associations between the models
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = { Order, OrderItem, Product };