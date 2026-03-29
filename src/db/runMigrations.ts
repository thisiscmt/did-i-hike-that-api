import { Umzug, SequelizeStorage } from 'umzug';
import { Logger } from 'winston';

import { db } from './models/index.js';
import { up as up_010200, down as down_010200 } from './migrations/migration_010200.js';
import { up as up_010204, down as down_010204 } from './migrations/migration_010204.js';
import { up as up_010206 } from './migrations/migration_010206.js';
import { up as up_010208 } from './migrations/migration_010208.js';
import { up as up_010400 } from './migrations/migration_010400.js';

export const runMigrations = async (logger: Logger) => {
    const umzug = new Umzug({
        migrations: [
            {
                name: '010200',
                up: up_010200,
                down: down_010200
            },
            {
                name: '010204',
                up: up_010204,
                down: down_010204
            },
            {
                name: '010206',
                up: up_010206,
            },
            {
                name: '010208',
                up: up_010208,
            },
            {
                name: '010400',
                up: up_010400,
            }
        ],
        context: db.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize: db }),
        logger
    });

    await umzug.up();
};
