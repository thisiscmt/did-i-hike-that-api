import express from 'express';
import cors from 'cors';

import baseRouter from './routes/baseRouter';
// import hikeRouter from './routes/hikeRouter';
import { getDatabase, getDBConfig } from './utils/databaseUtils';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: 'http://localhost:3000'
}));

app.use('/', baseRouter);
// app.use('/hike', hikeRouter);

const dbConfig = getDBConfig();
app.locals.memDb = getDatabase(dbConfig);

export default app;
