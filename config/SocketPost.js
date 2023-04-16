import { EmitToSocketURL } from '../config/Socket.js';
import config from '../config/index.js'
import http from 'http'

const { socketPort } = config;

//options
const emitOptions = {
    hostname: 'localhost',
    port: socketPort,
    path: EmitToSocketURL,
    rejectUnauthorized: false,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
}

const EmitToSocketPost = (response) => {
    try {
        const data = Buffer.from(JSON.stringify(response));
        emitOptions.headers['Content-Length'] = data.length;

        const request = http.request(emitOptions, response => {
            request.on('data', responseData => {
                console.info('on data', responseData)
            })
        })

        request.on('error', error => {
            console.error('error', error)
        })

        request.write(data);
        request.end();
    } catch (error) {
        console.log(error);
    }
}

export { EmitToSocketPost }