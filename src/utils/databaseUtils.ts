import {DataTypes, Sequelize} from 'sequelize';

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

    const hike = db.define("hike", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        trail: DataTypes.STRING,
        dateOfHike: DataTypes.DATE,
        description: DataTypes.STRING,
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

    const photo = db.define("photo", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        filePath: DataTypes.STRING,
        hikeId: DataTypes.UUIDV4
    });

    const people = db.define("people", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
    });

    const hikeRoster = db.define("hikeRoster", {}, { timestamps: false });

    hike.hasMany(photo, {
        foreignKey: 'hikeId'
    });
    photo.belongsTo(hike);
    hike.belongsToMany(people, { through: hikeRoster });
    people.belongsToMany(hike, { through: hikeRoster });

    return {
        db, hike, photo, people, hikeRoster
    };
}
