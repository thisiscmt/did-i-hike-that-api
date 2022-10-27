import express from 'express';
import cors from 'cors';

import baseRouter from './routes/baseRouter.js';
import hikeRouter from './routes/hikeRouter';
import { db } from './db/models';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: 'http://localhost:3005'
}));

app.use('/', baseRouter);
app.use('/hike', hikeRouter);

app.locals.hikeDb = db;

export default app;
