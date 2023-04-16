'use strict';
// import Socket from 'socket.io';
import { Server } from 'socket.io';
export const socketConnection = (server, path) => {
    const io = new Server(server, { path: path, serveClient: false });
    global.IO = io;
    io.on('connection', function (socket) {
        socket.emit('Connection Success');
    });
}

export const emitter = (url, response) => {
    console.info('URL : ' + url);
    if (global.IO) {
        try {
            global.IO.emit(url, response);
        } catch (err) {
            console.error('Error : ' + err);
        }
    }
}

