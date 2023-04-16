"use script";

export default dbconfig();

function dbconfig() {
    console.log('Environment : ' + process.env.NODE_ENV)
    switch (process.env.NODE_ENV) {
        case "local":
            return {
                sql: {
                    host: "localhost",
                    database: "shop_cart",
                    username: "root",
                    password: "root",
                    dialect: "mysql",
                    logging: true,
                    maxConcurrentQueries: 1000,
                    omitNull: true,
                    native: true,
                    language: "en"
                }
            };
        case "production":
            return {
                sql: {
                    host: "localhost",
                    database: "shop_cart",
                    username: "root",
                    password: "root",
                    dialect: "mysql",
                    logging: true,
                    maxConcurrentQueries: 1000,
                    omitNull: true,
                    native: true,
                    language: "en",
                    dialectOptions: {
                        option: {
                            requestTimeout: 120000
                        }
                    }
                }
            };
        case "develop":
            return {
                sql: {
                    host: "localhost",
                    database: "shop_cart",
                    username: "root",
                    password: "root",
                    dialect: "mysql",
                    port: "3414",
                    logging: true,
                    maxConcurrentQueries: 1000,
                    omitNull: true,
                    native: true,
                    language: "en",
                    dialectOptions: {
                        option: {
                            requestTimeout: 120000
                        }
                    }
                }
            };
        default:
            return {
                sql: {
                    host: "localhost",
                    database: "shop_cart",
                    username: "root",
                    password: "root",
                    dialect: "mysql",
                    logging: true,
                    maxConcurrentQueries: 1000,
                    omitNull: true,
                    native: true,
                    language: "en",
                    dialectOptions: {
                        option: {
                            requestTimeout: 120000
                        }
                    }
                }
            };
    }
}