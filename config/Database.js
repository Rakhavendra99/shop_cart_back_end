import {Sequelize} from "sequelize";

const db = new Sequelize('shop_cart', 'root', 'root', {
    host: "localhost",
    dialect: "mysql"
});

export default db;