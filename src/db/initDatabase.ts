import { db } from './models/index.js';

db.query('PRAGMA journal_mode=WAL;').then(() => {
    db.sync().then(() => {
        console.log('Database sync completed successfully');
    }).catch((error) => {
        console.log('Error with database sync: %o', error);
    });
});

