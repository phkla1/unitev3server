const { Sequelize, dbConnection } = require('./db');
const { User } = require('./account.model');

const CountryLevel4 = dbConnection.define('countrylevel4', {
    locationId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    level3_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const CountryLevel3 = dbConnection.define('countrylevel3', {
    level3_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    localityId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    level3_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const CountryLevel2 = dbConnection.define('countrylevel2', {
    localityId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    regionId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    localityName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const CountryLevel1 = dbConnection.define('countrylevel1', {
    regionId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    countryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    regionName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const Countries = dbConnection.define('countries', {
    countryId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    countryCode2: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    countryCode3: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    countryName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const Addresses = dbConnection.define('addresses', {
    addressId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },
    communityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: CountryLevel4,
            key: 'locationId',
        },
    },
    streetAddress: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

const Streets = dbConnection.define('streets', {
    streetId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: CountryLevel4,
            key: 'locationId',
        },
    },
    streetName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
},{
    timestamps: true
});

Streets.belongsTo(CountryLevel4, { foreignKey: 'locationId' });
CountryLevel4.hasMany(Streets, { foreignKey: 'locationId' });

Addresses.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Addresses, { foreignKey: 'userId' });

CountryLevel4.belongsTo(CountryLevel3, { foreignKey: 'level3_id' });
CountryLevel3.hasMany(CountryLevel4, { foreignKey: 'level3_id' });

CountryLevel3.belongsTo(CountryLevel2, { foreignKey: 'localityId' });
CountryLevel2.hasMany(CountryLevel3, { foreignKey: 'localityId' });

CountryLevel2.belongsTo(CountryLevel1, { foreignKey: 'regionId' });
CountryLevel1.hasMany(CountryLevel2, { foreignKey: 'regionId' });

CountryLevel1.belongsTo(Countries, { foreignKey: 'countryId' });
Countries.hasMany(CountryLevel1, { foreignKey: 'countryId' });

module.exports = {
    CountryLevel4,
    CountryLevel3,
    CountryLevel2,
    CountryLevel1,
    Countries,
    Addresses,
    Streets
};