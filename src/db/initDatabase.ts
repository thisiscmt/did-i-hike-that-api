import { db } from './models/index.js';
import * as SharedService from '../services/sharedService.js';

db.query('PRAGMA journal_mode=WAL;').then(() => {
    db.sync().then(() => {
        const store = SharedService.getSessionStore();
        store.sync();

        console.log('Database sync completed successfully');
    }).catch((error) => {
        console.log('Error with database sync: %o', error);
    });
});

