import { db } from './models/index.js';

db.sync().then(() => {
    console.log('Database sync completed successfully');
}).catch((error) => {
    console.log('Error with database sync: %o', error);
});
