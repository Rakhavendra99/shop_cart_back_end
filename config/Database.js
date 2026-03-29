import { Sequelize } from "sequelize";
import config from "./dbConfig.js";
const databaseconfig = config.sql;

/** MySQL physical tables (lowercase; match 29.3.26.sql for case-sensitive servers): cart, cart_item, category, cooking_rate, orderitems, orders, payments, product, sessions, store, users, vendor, vendor_type. Session store table name is set in index.js. Run migrations/add_cooking_workflow_columns.sql for cooking workflow columns on orders + cookingDescription on vendor. */

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