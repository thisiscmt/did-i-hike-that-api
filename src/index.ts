import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { MigrationError } from 'umzug';

import app from './app.js';
import {APP_DATA_PATH, IMAGES_PATH, UPLOADS_PATH} from './constants/constants.js';
import { runMigrations } from './db/runMigrations.js';

const port = process.env.PORT || 3055;

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    let exitProcess = false;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            exitProcess = true;

            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            exitProcess = true;

            break;
        default:
            throw error;
    }

    if (exitProcess) {
        process.exit(1);
    }
}


runMigrations().then(() => {
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
