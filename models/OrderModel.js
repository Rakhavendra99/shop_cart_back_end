import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

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
    // Optional: if customer chose a specific cooking vendor/partner for this order
    cookingVendorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    cookingWorkflowStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    cookingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cookingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cookingServiceFee: {
        type: DataTypes.DOUBLE,
        allowNull: true,
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
    freezeTableName: true,
    tableName: "orders",
});

Users.hasOne(Orders);
Orders.belongsTo(Users, { foreignKey: 'userId' });
export default Orders;