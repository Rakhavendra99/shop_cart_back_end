#!/usr/bin/env node

/**
 * Module dependencies.
 */
import App from './main.js';
import { socketConnection } from './socket/index.js';
import portocal from 'http'
import config from '../config/index.js'

const { socketPort: port } = config;
App.set('port', port)

/**
 * Create HTTP server.
 */
const HttpServer = portocal.createServer(App);

/**
 * Listen on provided port, on all network interfaces.
 */
HttpServer.on('error', onError);
HttpServer.on('listening', onListening);

socketConnection(HttpServer, '/socket/shop_cart');
HttpServer.listen(port);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = HttpServer.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.info('Listening on ' + bind);
}
