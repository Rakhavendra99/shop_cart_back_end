import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Orders = db.define('orders', {
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
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    totalAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    totalTaxAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: true
        }
    },
    isActive: {
        type: DataTypes.TINYINT,
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


export default Orders;