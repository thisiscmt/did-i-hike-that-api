import { DataTypes, Sequelize } from 'sequelize';
import { Options } from 'sequelize/types/sequelize';

import { Hike } from './hike.js';
import { Hiker } from './hiker.js';
import { Photo } from './photo.js';

export const getDBConfig = (): Options => {
    return {
        dialect: 'sqlite',
        storage: './data/did_i_hike_that.sqlite3'
        // TODO: Figure out how to get the logging option from the config file
        // logging: config[process.env.MEM_APP_ENV].logging
    }
}

const db = new Sequelize(getDBConfig());

Hike.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    trail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dateOfHike: {
        type: DataTypes.DATE,
        allowNull: false
    },
    description: DataTypes.STRING,
    link: DataTypes.STRING,
    weather: DataTypes.STRING,
    crowds: DataTypes.STRING,
    tags: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    tableName: 'hikes',
    sequelize: db,
    indexes: [
        {
            unique: false,
            fields: ['trail']
        },
        {
            unique: false,
            fields: ['dateOfHike']
        },
        {
            unique: false,
            fields: ['tags']
        }
    ]
});

Photo.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    filePath: DataTypes.STRING,
    hikeId: DataTypes.UUIDV4,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    tableName: 'photos',
    sequelize: db
});

Hiker.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    fullName: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
}, {
    tableName: 'hikers',
    sequelize: db,
    indexes: [
        {
            unique: false,
            fields: ['fullName']
        }
    ]
});

const HikeRoster = db.define('hikeRoster', {}, { timestamps: false });

Hike.hasMany(Photo, {
    sourceKey: 'id',
    foreignKey: 'hikeId',
    as: 'photos'
});
Photo.belongsTo(Hike, { targetKey: 'id', foreignKey: 'hikeId' });
Hike.belongsToMany(Hiker, { through: HikeRoster, as: 'hikers' });
Hiker.belongsToMany(Hike, { through: HikeRoster });

export { db };
