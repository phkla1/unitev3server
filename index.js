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

dbConnection.sync().then(async () => {
    console.log('DB tables created successfully!');
    // Seed the database with users and sellers
    /*
    const { User } = require('./models/account.model');
    const { Seller } = require('./models/account.model');
    const userSeed = require('./seed/user.json');
    const sellerSeed = require('./seed/seller.json');

    User.bulkCreate(userSeed).then(() => {
        console.log('Users seeded successfully!');
        Seller.bulkCreate(sellerSeed).then(() => {
            console.log('Sellers seeded successfully!');
        }).catch((error) => {
            console.error('Unable to seed sellers: ', error);
        });
    }).catch((error) => {
        console.error('Unable to seed users: ', error);
    });
    */

    // Seed the database with location data
    /*
    const { Countries, CountryLevel1, CountryLevel2, CountryLevel3, CountryLevel4, Streets } = require('./models/location.model');
    const countries = require('./seed/countries.json');
    const countryLevel1Seed = require('./seed/countryLevel1.json');
    const countryLevel2Seed = require('./seed/countryLevel2.json');
    const countryLevel3Seed = require('./seed/countryLevel3.json');
    const countryLevel4Seed = require('./seed/countryLevel4.json');
    const streetSeed = require('./seed/streets.json');

    await Countries.bulkCreate(countries);
    console.log('Countries seeded successfully!');
    await CountryLevel1.bulkCreate(countryLevel1Seed);
    console.log('CountryLevel1 seeded successfully!');
    await CountryLevel2.bulkCreate(countryLevel2Seed);
    console.log('CountryLevel2 seeded successfully!');
    await CountryLevel3.bulkCreate(countryLevel3Seed);
    console.log('CountryLevel3 seeded successfully!');
    await CountryLevel4.bulkCreate(countryLevel4Seed);
    console.log('CountryLevel4 seeded successfully!');
    await Streets.bulkCreate(streetSeed);
    console.log('Streets seeded successfully. Seeding complete!');
    */

}).catch((error) => {
    console.error('Unable to create database: ', error);
});

const apiPrefix = '/api/v3';
const apiRouter = express.Router();
app.use(apiPrefix, apiRouter);

const accountsRoutes = require('./routes/accountsRoutes');
apiRouter.use('/accounts', accountsRoutes);

const sellersRoutes = require('./routes/sellerRoutes');
apiRouter.use('/sellers', sellersRoutes);

const productsRoutes = require('./routes/productsRoutes');
apiRouter.use('/products', productsRoutes);

const ordersRoutes = require('./routes/ordersRoutes');
apiRouter.use('/orders', ordersRoutes);

const walletsRoutes = require('./routes/walletsRoutes');
apiRouter.use('/wallets', walletsRoutes);

const locationsRoutes = require('./routes/locationsRoutes');
apiRouter.use('/locations', locationsRoutes);

const url = `${process.env.PORT || 3000}`;
app.listen(url, () => {
    console.log(`Starting UniteV3 on port ${process.env.PORT || 3000}`);
});