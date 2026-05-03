import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { MigrationError } from 'umzug';
import * as winston from 'winston';

import app from './app.js';
import { runMigrations } from './db/runMigrations.js';
import * as Constants from './constants/constants.js';

const port = process.env.PORT || 3055;
const { format, createLogger, transports } = winston;
const { timestamp: timestamp, combine: combine, errors: errors, json: json } = format;

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

function buildDevLogger() {
    return createLogger({
        format: combine(timestamp(), errors({ stack: true }), json()),
        defaultMeta: { service: "diht-api" },
        transports: [
            new transports.Console(),
            new transports.File({ filename: Constants.LOG_FILE_NAME })
        ]
    });
}

function buildProdLogger() {
    return createLogger({
        format: combine(timestamp(), errors({ stack: true }), json()),
        defaultMeta: { service: "diht-api" },
        transports: [
            new transports.File({ filename: Constants.LOG_FILE_NAME })
        ]
    });
}

let logger: winston.Logger;

if (process.env.NODE_ENV === 'development') {
    logger = buildDevLogger();
} else {
    logger = buildProdLogger();
}

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
        logger.error(`${msgPrefix}: ${error.cause}. Stack: ${error.stack}`);
    } else if (error instanceof Error) {
        logger.error(`${msgPrefix}: ${error.message}. Stack: ${error.stack}`);
    } else {
        logger.error(msgPrefix);
    }

    process.exit(1);
}
