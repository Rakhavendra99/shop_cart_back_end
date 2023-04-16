import { Sequelize } from "sequelize";
import config from "./dbConfig.js";
const databaseconfig = config.sql;

const db = new Sequelize(
    databaseconfig.database,
    databaseconfig.username,
    databaseconfig.password,
    {
        host: databaseconfig.host,
        dialect: databaseconfig.dialect
    }
);

export default db;