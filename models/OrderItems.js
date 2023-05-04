import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Orders from "./OrderModel.js";
import Products from "./ProductModel.js";

const { DataTypes } = Sequelize;

const OrderItems = db.define('orderItems', {
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
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            notEmpty: true,
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    productPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    gst: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    orderType: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            notEmpty: true
        }
    },
}, {
    freezeTableName: true
});

Orders.hasMany(OrderItems);
OrderItems.belongsTo(Orders, { foreignKey: 'orderId' });
Products.hasOne(OrderItems);
OrderItems.belongsTo(Products, { foreignKey: 'productId' });
export default OrderItems;