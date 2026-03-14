import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Orders from "./OrderModel.js";

const { DataTypes } = Sequelize;

const Payments = db.define('payments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        validate: { notEmpty: true }
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { notEmpty: true }
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true }
    },
    payment_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true }
    },
    transaction_reference: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

Orders.hasOne(Payments);
Payments.belongsTo(Orders, { foreignKey: 'orderId' });

export default Payments;
