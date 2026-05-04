import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { MigrationError } from 'umzug';

import app from './app.js';
import { runMigrations } from './db/runMigrations.js';
import * as SharedService from './services/sharedService.js';
import * as Constants from './constants/constants.js';

const port = process.env.PORT || 3055;

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        logger.error(error);
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    let exitProcess = false;

    switch (error.code) {
        case 'EACCES':
            logger.error(bind + ' requires elevated privileges');
            exitProcess = true;

            break;
        case 'EADDRINUSE':
            logger.error(bind + ' is already in use');
            exitProcess = true;

            break;
        default:
            logger.error(error);
            throw error;
    }

    if (exitProcess) {
        process.exit(1);
    }
}

const logger = SharedService.getLogger();

try {
    await runMigrations(logger);

    try {
        app.set('port', port);

        if (!fs.existsSync(Constants.APP_DATA_PATH)) {
            fs.mkdirSync(Constants.APP_DATA_PATH);
        }

        if (!fs.existsSync(Constants.IMAGES_PATH)) {
            fs.mkdirSync(Constants.IMAGES_PATH);
        }

        if (!fs.existsSync(Constants.UPLOADS_PATH)) {
            fs.mkdirSync(Constants.UPLOADS_PATH);
        }

        app.locals.logger = logger;
        app.use('/images', express.static(path.join(process.cwd(), 'app_data', 'images')));

        const server = http.createServer(app);
        server.listen(port);
        server.on('error', onError);

        logger.info(`Did I Hike That? API has started on port ${port}`);
    } catch (error) {
        logger.error('Error starting the API', error);
        process.exit(1);
    }
} catch (error) {
    const msgPrefix = 'Error during a database migration';

    if (error instanceof MigrationError) {
        logger.error(`${msgPrefix}: ${error.cause}`, error);
    } else if (error instanceof Error) {
        logger.error(`${msgPrefix}: ${error.message}`, error);
    } else {
        logger.error(msgPrefix);
    }

    process.exit(1);
}
