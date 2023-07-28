const { Sequelize, dbConnection } = require('./db');
const { Product } = require('./product.model');

// define the Order model
const Order = dbConnection.define('Order', {
	orderId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	userId: {
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
	}
});

// define the OrderItem model
const OrderItem = dbConnection.define('OrderItem', {
	orderId: {
		type: Sequelize.INTEGER,
		allowNull: false,
		references: {
            model: Order,
            key: 'orderId'
        }
	},
	productId: {
		type: Sequelize.INTEGER,
		allowNull: false,
		references: {
            model: Product,
            key: 'productId'
        }
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
Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);
OrderItem.belongsTo(Product);

module.exports = { Order, OrderItem, Product };