import {DataTypes, Sequelize} from 'sequelize';
import { Options } from 'sequelize/types/sequelize';

export const getDBConfig = (): Options => {
    return {
        dialect: 'sqlite',
        storage: './data/did_i_hike_that.sqlite3'
        // TODO: Figure out how to get the logging option from the config file
        // logging: config[process.env.MEM_APP_ENV].logging
    }
}

const db = new Sequelize(getDBConfig());

const Hike = db.define("hike", {
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
}, {
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

const Photo = db.define("photo", {
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
}, {
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

const Hiker = db.define("hiker", {
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
}, {
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

const HikeRoster = db.define("hikeRoster", {}, { timestamps: false });

Hike.hasMany(Photo, {
    foreignKey: 'hikeId'
});
Photo.belongsTo(Hike);
Hike.belongsToMany(Hiker, { through: HikeRoster });
Hiker.belongsToMany(Hike, { through: HikeRoster });

export { db, Hike, Photo, Hiker };
