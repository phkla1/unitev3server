'use strict';
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
const { dbConnection } = require('./models/db');

dbConnection.sync().then(() => {
	console.log('DB tables created successfully!');
	/*
    // Seed the database with users, sellers, and products
    const { User } = require('./models/account.model');
    const { Seller } = require('./models/account.model');
    const { Product } = require('./models/product.model');
    const userSeed = require('./seed/user.json');
    const sellerSeed = require('./seed/seller.json');
    const productSeed = require('./seed/product.json');

    User.bulkCreate(userSeed).then(() => {
        console.log('Users seeded successfully!');
        Seller.bulkCreate(sellerSeed).then(() => {
            console.log('Sellers seeded successfully!');
            Product.bulkCreate(productSeed).then(() => {
                console.log('Products seeded successfully!');
            }).catch((error) => {
                console.error('Unable to seed products: ', error);
            });
        }).catch((error) => {
            console.error('Unable to seed sellers: ', error);
        });
    }).catch((error) => {
        console.error('Unable to seed users: ', error);
    });
	*/
}).catch((error) => {
	console.error('Unable to create database: ', error);
});

const accountsRoutes = require('./routes/accountsRoutes');
app.use('/accounts', accountsRoutes);

const sellersRoutes = require('./routes/sellerRoutes');
app.use('/sellers', sellersRoutes);

const productsRoutes = require('./routes/productsRoutes');
app.use('/products', productsRoutes);

const ordersRoutes = require('./routes/ordersRoutes');
app.use('/orders', ordersRoutes);

const url = `${process.env.PORT || 3000}`;
app.listen(url, () => {
	console.log('Starting UniteV3 on port 3000');
});