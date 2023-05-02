import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import Stores from "./StoreModel.js";

const { DataTypes } = Sequelize;

const Cart = db.define('cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: false,
        autoIncrement: true,
        validate: {
            notEmpty: true
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            notEmpty: true,
        }
    },
    storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    isActive: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});
Users.hasOne(Cart);
Cart.belongsTo(Users, { foreignKey: 'userId' });
Stores.hasOne(Cart);
Cart.belongsTo(Stores, { foreignKey: 'storeId' });
export default Cart;