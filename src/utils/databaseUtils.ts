import DataTypes, { Sequelize } from 'sequelize';

export const getDBConfig = () => {
    return {
        dialect: 'sqlite',
        storage: './data/did_i_hike_that.sqlite3'
        // TODO: Figure out how to get the logging option from the config file
        // logging: config[process.env.MEM_APP_ENV].logging
    }
}

export const getDatabase = (dbConfig) => {
    const db = new Sequelize(dbConfig);

    const moment = db.define("moment", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        comment: DataTypes.STRING,
        tags: DataTypes.STRING,
        userId: DataTypes.STRING
    });

    const photo = db.define("photo", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        filePath: DataTypes.STRING,
        momentId: DataTypes.UUIDV4
    });

    const user = db.define("user", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        userName: DataTypes.STRING,
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        lastLogin: DataTypes.DATE
    });

    return {
        db, moment, photo, user
    };
}
