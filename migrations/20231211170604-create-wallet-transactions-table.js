'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable('WalletTransactions', {
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
		});
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.dropTable('WalletTransactions');
	}
};
