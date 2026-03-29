import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import VendorType from "./VendorTypeModel.js";

const { DataTypes } = Sequelize;

const Vendor = db.define("vendor", {
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
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    vendorTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    availableTimeSlots: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cookingDescription: {
        type: DataTypes.TEXT,
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
    freezeTableName: true,
    tableName: "vendor",
});

Users.hasOne(Vendor);
Vendor.belongsTo(Users, { foreignKey: "userId" });

VendorType.hasOne(Vendor);
Vendor.belongsTo(VendorType, { foreignKey: "vendorTypeId" });

export default Vendor;

