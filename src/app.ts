import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import baseRouter from './routes/baseRouter.js';
import hikeRouter from './routes/hikeRouter.js';
import hikerRouter from './routes/hikerRouter.js';
import userRouter from './routes/userRouter.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.DIHT_ALLOWED_ORIGIN
}));

app.use('/', baseRouter);
app.use('/hike', hikeRouter);
app.use('/hiker', hikerRouter);
app.use('/user', userRouter);

export default app;
