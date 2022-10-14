import {getDatabase, getDBConfig} from "./databaseUtils";

const dbConfig = getDBConfig();
const { db } = getDatabase(dbConfig);

db.sync().then(() => {
    console.log('Database sync completed successfully');
}).catch((error) => {
    console.log('Error with database sync: %o', error);
});
