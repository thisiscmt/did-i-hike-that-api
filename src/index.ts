import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';

import app from './app.js';
//import { db } from './db/models/index.js';
import { IMAGES_PATH, UPLOADS_PATH } from './constants/constants.js';

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
app.set('port', port);
app.use('/images', express.static(path.join(process.cwd(), 'app_data', 'images')));

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);

console.log('IMAGES_PATH: %o', IMAGES_PATH);

try {
    if (!fs.existsSync(IMAGES_PATH)) {
        fs.mkdirSync(IMAGES_PATH);
    }

    if (!fs.existsSync(UPLOADS_PATH)) {
        fs.mkdirSync(UPLOADS_PATH);
    }
} catch (error) {
    console.log('Error creating required directories: %o', error);
}

console.log(`Did I Hike That? API has started on port ${port}`);

// try {
//     const dbCommitinterval = Number(process.env.DIHT_DB_COMMIT_INTERVAL) || 43200000;  // 12 hour default
//
//     setInterval(() => {
//         db.query('pragma wal_checkpoint(TRUNCATE);').then(() => {
//             console.log(`Database checkpoint completed successfully`);
//         }).catch((error) => {
//             console.log('Error executing database checkpoint: %o', error);
//         });
//     }, dbCommitinterval);
// } catch (error) {
//     console.log('Error setting up DB commit timer interval: %o', error);
// }
