import { DataTypes, Sequelize } from 'sequelize';
import { Options } from 'sequelize/types/sequelize';

import { Hike } from './hike';
import { Hiker } from './hiker';
import { Photo } from './photo';

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
    trail: DataTypes.STRING,
    description: DataTypes.STRING,
    dateOfHike: DataTypes.DATE,
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
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
}, {
    tableName: 'hikers',
    sequelize: db,
    indexes: [
        {
            unique: false,
            fields: ['firstName']
        },
        {
            unique: false,
            fields: ['lastName']
        }
    ]
});

const HikeRoster = db.define("hikeRoster", {}, { timestamps: false });

Hike.hasMany(Photo, {
    sourceKey: 'id',
    foreignKey: 'hikeId',
    as: 'photos'
});
Photo.belongsTo(Hike, { targetKey: 'id' });
Hike.belongsToMany(Hiker, { through: HikeRoster });
Hiker.belongsToMany(Hike, { through: HikeRoster });

export { db, Hike, Photo, Hiker };
