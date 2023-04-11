import express from 'express';
import cors from 'cors';
import session from 'express-session';
import helmet from "helmet";

import baseRouter from './routes/baseRouter.js';
import hikeRouter from './routes/hikeRouter.js';
import hikerRouter from './routes/hikerRouter.js';
import authRouter from './routes/authRouter.js';
import * as SharedService from './services/sharedService.js'

declare module "express-session" {
    interface SessionData {
        email: string;
    }
}

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: function(origin, callback){
        if (process.env.NODE_ENV === 'production') {
            return callback(null, process.env.DIHT_ALLOWED_ORIGIN)
        } else {
            return callback(null, true);
        }
    },
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: {
        policy: 'cross-origin'
    }
}));

const appSession: session.SessionOptions = {
    secret: process.env.DIHT_SECURITY_KEY || '',
    store: SharedService.getSessionStore(),
    name: 'sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.cmtybur.com' : undefined,
        maxAge: 31536000000,
        httpOnly: true
    },
    resave: false,
    saveUninitialized: false
};

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session(appSession))

app.use('/', baseRouter);
app.use('/hike', hikeRouter);
app.use('/hiker', hikerRouter);
app.use('/auth', authRouter);

export default app;
