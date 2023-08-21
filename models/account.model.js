const {Sequelize, dbConnection} = require('./db');
	
const User = dbConnection.define('user', {
	userId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	firstname: {
		type: Sequelize.STRING,
		allowNull: false
	},
	surname: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	referralCode : {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	email: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	phone: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	role: {
		type: Sequelize.STRING
	},
	profilePicture: {
		type: Sequelize.STRING
	},
	walletId: {
		type: Sequelize.STRING
	},
	address: {
		type: Sequelize.STRING
	},
	active : {
		type: Sequelize.BOOLEAN
	}},
	{
		hooks : {
			beforeCreate : (record, options) => {
				record.dataValues.createdAt = Date.now();
				record.dataValues.updatedAt = Date.now();
			},
			beforeUpdate : (record, options) => {
				record.dataValues.updatedAt = Date.now();
			}
		}
	}
);

const Seller = dbConnection.define('seller', {
	sellerId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
    businessName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    businessEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    businessPhone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
});

Seller.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Seller };