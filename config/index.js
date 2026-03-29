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
                stripe: {
                    secretKey: "sk_test_51TAlu40R590SWJCI3AZui5DaV8A7Lx2b61UEch4Y4VyqG9AI3YC9DRrSsNx11KDi7M3WYDKIO7QPx2qv8Sprvikn00mJakVpON",
                    webhookSecret: "whsec_YaojvuF7o3V4M7jnrVPt9EPmvJ3Y0K8Z"
                }
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
                stripe: {
                    secretKey: "sk_test_51TAlu40R590SWJCI3AZui5DaV8A7Lx2b61UEch4Y4VyqG9AI3YC9DRrSsNx11KDi7M3WYDKIO7QPx2qv8Sprvikn00mJakVpON",
                    webhookSecret: "whsec_YaojvuF7o3V4M7jnrVPt9EPmvJ3Y0K8Z"
                }
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
                stripe: {
                    secretKey: "sk_test_51TAlu40R590SWJCI3AZui5DaV8A7Lx2b61UEch4Y4VyqG9AI3YC9DRrSsNx11KDi7M3WYDKIO7QPx2qv8Sprvikn00mJakVpON",
                    webhookSecret: "whsec_YaojvuF7o3V4M7jnrVPt9EPmvJ3Y0K8Z"
                }
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
                stripe: {
                    secretKey: "sk_test_51TAlu40R590SWJCI3AZui5DaV8A7Lx2b61UEch4Y4VyqG9AI3YC9DRrSsNx11KDi7M3WYDKIO7QPx2qv8Sprvikn00mJakVpON",
                    webhookSecret: "whsec_YaojvuF7o3V4M7jnrVPt9EPmvJ3Y0K8Z"
                }
            };
    }
};