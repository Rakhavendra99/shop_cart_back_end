'use script';

export default value();

function value() {
    console.log('Environment : ' + process.env.NODE_ENV)
    switch (process.env.NODE_ENV) {
        case 'develop':
            return {
                responseCode: {
                    BAD_REQUEST: 400,
                    UNAUTHORIZED: 401,
                    SUCCESS: 200,
                },
                host: process.env.IP,
                port: 5000,
                socketPort: 5006,
                limit: 100,
                offset: 0,
                isShowOTP: 0,
            };
        case 'local':
            return {
                responseCode: {
                    BAD_REQUEST: 400,
                    UNAUTHORIZED: 401,
                    SUCCESS: 200,
                },
                host: process.env.IP,
                port: 5000,
                socketPort: 5006,
                limit: 100,
                offset: 0,
                isShowOTP: 0,
            };
        case 'production':
            return {
                responseCode: {
                    BAD_REQUEST: 400,
                    UNAUTHORIZED: 401,
                    SUCCESS: 200,
                },
                host: process.env.IP,
                port: 5000,
                socketPort: 5006,
                limit: 100,
                offset: 0,
                isShowOTP: 0,
            };
        default:
            return {
                responseCode: {
                    BAD_REQUEST: 400,
                    UNAUTHORIZED: 401,
                    SUCCESS: 200,
                },
                host: process.env.IP,
                port: 5000,
                socketPort: 5006,
                limit: 100,
                offset: 0,
                isShowOTP: 0,
            };
    }
};