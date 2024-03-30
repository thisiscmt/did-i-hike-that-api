import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import {MigrationError} from 'umzug';

import app from './app.js';
import {APP_DATA_PATH, IMAGES_PATH, UPLOADS_PATH} from './constants/constants.js';
import { runMigrations } from './db/runMigrations.js';
import * as SharedService from './services/sharedService.js';

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

const port = process.env.PORT || 3055;

declare module "express-session" {
    interface SessionData {
        email: string;
        role: string;
    }
}

runMigrations().then(() => {
    const appSession: session.SessionOptions = {
        secret: process.env.DIHT_SECURITY_KEY || '',
        store: SharedService.getSessionStore(),
        name: 'sid',
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.NODE_ENV === 'production' ? '.cmtybur.com' : undefined,
            maxAge: 15552000000,  // 180 days
            httpOnly: true
        },
        resave: false,
        saveUninitialized: false
    };

    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }

    app.use(session(appSession))
    app.set('port', port);
    app.use('/images', express.static(path.join(process.cwd(), 'app_data', 'images')));

    try {
        if (!fs.existsSync(APP_DATA_PATH)) {
            fs.mkdirSync(APP_DATA_PATH);
        }

        if (!fs.existsSync(IMAGES_PATH)) {
            fs.mkdirSync(IMAGES_PATH);
        }

        if (!fs.existsSync(UPLOADS_PATH)) {
            fs.mkdirSync(UPLOADS_PATH);
        }

        const server = http.createServer(app);
        server.listen(port);
        server.on('error', onError);

        console.log(`Did I Hike That? API has started on port ${port}`);
    } catch (error) {
        console.log('Error starting the API: %o', error);
        process.exit(1);
    }
}).catch((error) => {
    const msgPrefix = 'Error during a database migration';

    if (error instanceof MigrationError) {
        console.log(`${msgPrefix}: %o`, error.cause);
    } else {
        console.log(`${msgPrefix}: %o`, error.message);
    }

    process.exit(1);
});
