import { Umzug, SequelizeStorage } from 'umzug';

import { db } from './models/index.js';
import { up as up_010200, down as down_010200 } from './migrations/migration_010200.js';

export const runMigrations = async () => {
    const umzug = new Umzug({
        migrations: [
            {
                name: '010200',
                up: up_010200,
                down: down_010200
            }
        ],
        context: db.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize: db }),
        logger: console
    });

    await umzug.up();
};
