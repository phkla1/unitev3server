const {Sequelize, dbConnection} = require('./db');

const Verification = dbConnection.define('verification', {
	verificationId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	userId: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	type: {
		type: Sequelize.STRING,
		allowNull: false
	},
	verificationMessage: {
		type: Sequelize.STRING,
		allowNull: false
	},
	validityStatus: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	},
	verifiedStatus: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	random: {
		type: Sequelize.STRING,
		allowNull: true,
		defaultValue: null
	}
},{
	hooks : {
		beforeUpdate : (record, options) => {
			record.dataValues.updatedAt = Date.now();
		}
	}
});


module.exports = Verification;