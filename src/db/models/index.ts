import { DataTypes, Options, Sequelize } from 'sequelize';

import { Hike } from './hike.js';
import { Hiker } from './hiker.js';
import { Photo } from './photo.js';
import { User } from './user.js';
import { Session } from './session.js';

export const dbOptions: Options = {
    dialect: 'sqlite',
    storage: './app_data/did_i_hike_that.sqlite3',
    logging: false
};

if (process.env.DIHT_DB_LOGGING !== undefined && process.env.DIHT_DB_LOGGING === '1') {
    dbOptions.logging = console.log;
}

const db = new Sequelize(dbOptions);

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
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDateOfHike: {
        type: DataTypes.DATEONLY
    },
    description: DataTypes.TEXT,
    link: DataTypes.STRING,
    linkLabel: DataTypes.STRING,
    conditions: DataTypes.STRING,
    crowds: DataTypes.STRING,
    tags: DataTypes.STRING,
    deleted: DataTypes.BOOLEAN,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    userId: DataTypes.TEXT
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
        },
        {
            unique: false,
            fields: ['deleted']
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
    fileName: DataTypes.STRING,
    filePath: DataTypes.STRING,
    ordinal: DataTypes.INTEGER,
    caption: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hikeId: DataTypes.UUIDV4,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    tableName: 'photos',
    sequelize: db,
    indexes: [
        {
            unique: false,
            fields: ['fileName', 'hikeId']
        }
    ]
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

User.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    fullName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    lastLogin: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    tableName: 'users',
    sequelize: db,
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});

Session.init({
    sid: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    expires: DataTypes.DATE,
    data: DataTypes.TEXT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
}, {
    tableName: 'sessions',
    sequelize: db
});

const HikeRoster = db.define('hikeRoster', {}, { timestamps: false });

Hike.hasMany(Photo, {
    sourceKey: 'id',
    foreignKey: 'hikeId',
    as: 'photos',
    onDelete: 'cascade'
});
Hike.hasOne(User, {
    sourceKey: 'userId',
    foreignKey: 'id',
    as: 'user',
});
Photo.belongsTo(Hike, { targetKey: 'id', foreignKey: 'hikeId' });
Hike.belongsToMany(Hiker, { through: HikeRoster, as: 'hikers' });
Hiker.belongsToMany(Hike, { through: HikeRoster });

export { db };
