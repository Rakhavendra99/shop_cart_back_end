import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Cart from "./CartModel.js";
import Products from "./ProductModel.js";

const {DataTypes} = Sequelize;

const CartItem = db.define('cart_item',{
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
    cartId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: true,
        }
    },
    productId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: true,
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
},{
    freezeTableName: true
});
Cart.hasMany(CartItem);
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
Products.hasOne(CartItem);
CartItem.belongsTo(Products, { foreignKey: 'productId' });
export default CartItem;