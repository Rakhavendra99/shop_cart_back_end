import Category from "../models/CategoryModel.js";
import Products from "../models/ProductModel.js";
import Users from "../models/UserModel.js";
import User from "../models/UserModel.js";
import argon2 from "argon2";

export const getUsers = async (req, res) => {
    try {
        const response = await User.findAll({
            attributes: ['id', 'name', 'email', 'role']
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getUserById = async (req, res) => {
    try {
        const response = await User.findOne({
            attributes: ['id', 'name', 'email', 'role'],
            where: {
                id: req.params.id
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createUser = async (req, res) => {
    const { name, email, password, confPassword, role } = req.body;
    if (password !== confPassword) return res.status(403).json({ msg: "Password not match" });
    const hashPassword = await argon2.hash(password);
    try {
        let findUser = await User.findOne({
            where: {
                email: email
            }
        })
        if (findUser) {
            return res.status(403).json({ msg: "This Email already taken, can you try other email Id." });
        }
        let createUsers = await User.create({
            name: name,
            email: email,
            password: hashPassword,
            role: role
        });
        res.status(201).json({ msg: createUsers });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const updateUser = async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.params.id
        }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    const { name, email, password, confPassword, role } = req.body;
    let hashPassword;
    if (password === "" || password === null) {
        hashPassword = user.password
    } else {
        hashPassword = await argon2.hash(password);
    }
    if (password !== confPassword) return res.status(400).json({ msg: "Password not match" });
    try {
        let updateUser = await User.update({
            name: name,
            email: email,
            password: hashPassword,
            role: role
        }, {
            where: {
                id: user.id
            }
        });
        res.status(200).json({ msg: updateUser });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const deleteUser = async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.params.id
        }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    try {
        let deleteUser = await User.destroy({
            where: {
                id: user.id
            }
        });
        res.status(200).json({ deleteUser });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const VendorgetDasboard = async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.session.userId
        }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    try {
        let productCount = await Products.findAll({
            where: {
                storeId: 1
            },
            attributes: ['id']
        });
        let categoryCount = await Category.findAll({
            where: {
                storeId: 1
            },
            attributes: ['id']
        })
        let result = {}
        result['productCount'] = productCount.length
        result['categoryCount'] = categoryCount.length
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const AdmingetDasboard = async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.session.userId
        }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    try {
        let productCount = await Products.findAll({
            attributes: ['id']
        });
        let categoryCount = await Category.findAll({
            attributes: ['id']
        })
        let vendorCount = await Users.findAll({
            where:{
                role: "vendor"
            },
            attributes: ['id']
        })
        let customerCount = await Users.findAll({
            where:{
                role: "user"
            },
            attributes: ['id']
        })
        let result = {}
        result['productCount'] = productCount.length
        result['categoryCount'] = categoryCount.length
        result['vendorCount'] = vendorCount.length
        result['customerCount'] = customerCount.length
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}