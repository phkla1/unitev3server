const { Sequelize } = require("sequelize");
const dbConnection = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: '127.0.0.1',
		dialect: 'mysql',
//		logging: false
	},
);
dbConnection.authenticate().then(() => {
	console.log('Connection has been established successfully.');
}).catch((error) => {
	console.error('Unable to connect to the database: ', error);
});

module.exports = { Sequelize, dbConnection };
