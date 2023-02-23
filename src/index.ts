import debug from 'debug';
import http from 'http';
import express from 'express';
import path from 'path';

import app from './app.js';

debug('did-i-hike-that-api');

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

function onListening() {
    const addr = server.address();

    if (addr) {
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        debug('Listening on ' + bind);
    }
}

const port = process.env.PORT || 3055;
app.set('port', port);
app.use('/images', express.static(path.join(process.cwd(), 'data', 'images')));

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

console.log(`Did I Hike That? API has started on port ${port}`);
