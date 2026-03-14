import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Vendor from "./VendorModel.js";

const { DataTypes } = Sequelize;

const CookingRate = db.define("cooking_rate", {
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
    vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    rateType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    rateAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});

Vendor.hasOne(CookingRate);
CookingRate.belongsTo(Vendor, { foreignKey: "vendorId" });

export default CookingRate;

