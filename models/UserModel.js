import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const {DataTypes} = Sequelize;

const Users = db.define('users',{
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
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true,
            len: [3, 100]
        }
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true,
            isEmail: true
        }
    },
    password:{
        type: DataTypes.STRING,
        allowNull: true,
        validate:{
            notEmpty: true
        }
    },
    role:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    phone:{
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    isActive:{
        type: DataTypes.INTEGER,
        allowNull: true,
    }
},{
    freezeTableName: true
});

export default Users;