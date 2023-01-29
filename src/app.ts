import express from 'express';
import cors from 'cors';

import baseRouter from './routes/baseRouter.js';
import hikeRouter from './routes/hikeRouter.js';
import hikerRouter from './routes/hikerRouter.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: 'http://localhost:3050'
}));

app.use('/', baseRouter);
app.use('/hike', hikeRouter);
app.use('/hiker', hikerRouter);

export default app;
