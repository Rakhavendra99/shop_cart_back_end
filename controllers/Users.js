import Category from "../models/CategoryModel.js";
import Products from "../models/ProductModel.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";
import User from "../models/UserModel.js";
import Orders from "../models/OrderModel.js";
import argon2 from "argon2";
import { Op } from "sequelize";
import { getStoreId, getRequestParser, postRequestParser } from "../util/index.js";

/**
 * Parse YYYY-MM-DD strings to start/end of day in local time.
 * Returns { from: Date, to: Date } or null if invalid.
 */
function parseDateRange(fromDate, toDate) {
    const strFrom = typeof fromDate === "string" ? fromDate.trim() : (fromDate && String(fromDate));
    const strTo = typeof toDate === "string" ? toDate.trim() : (toDate && String(toDate));
    if (!strFrom || !strTo) return null;
    const matchFrom = /^(\d{4})-(\d{2})-(\d{2})$/.exec(strFrom);
    const matchTo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(strTo);
    if (!matchFrom || !matchTo) return null;
    const y1 = parseInt(matchFrom[1], 10), m1 = parseInt(matchFrom[2], 10) - 1, d1 = parseInt(matchFrom[3], 10);
    const y2 = parseInt(matchTo[1], 10), m2 = parseInt(matchTo[2], 10) - 1, d2 = parseInt(matchTo[3], 10);
    const from = new Date(y1, m1, d1, 0, 0, 0, 0);
    const to = new Date(y2, m2, d2, 23, 59, 59, 999);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    if (from.getTime() > to.getTime()) return { from: to, to: from };
    return { from, to };
}

export const getUsers = async (req, res) => {
    try {
        const response = await User.findAll({
            where: {
                role: ["customer", "vendor"]
            },
            attributes: ['id', 'name', 'email', 'role', 'isActive']
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
            role: role,
            isActive: 1
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
    if (password) {
        if (password === "" || password === null) {
            hashPassword = user.password
        } else {
            hashPassword = await argon2.hash(password);
        }
        if (password !== confPassword) {
            return res.status(400).json({ msg: "Password not match" });
        }
    }
    const data = postRequestParser(req)
    try {
        data.password = hashPassword
        let updateUser = await user.update(Object.assign({}, data))
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
    const storeId = getStoreId(req);
    const query = req.query || getRequestParser(req) || {};
    const fromDate = query.fromDate ?? query.from;
    const toDate = query.toDate ?? query.to;
    const user = await User.findOne({
        where: { id: req.session.userId }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    try {
        let productCount = await Products.findAll({
            where: { storeId },
            attributes: ['id']
        });
        let categoryCount = await Category.findAll({
            where: { storeId },
            attributes: ['id']
        });
        let result = {
            productCount: productCount.length,
            categoryCount: categoryCount.length,
            ordersCount: 0,
            totalOrderAmount: 0
        };
        const range = parseDateRange(fromDate, toDate);
        if (range) {
            const ordersInRange = await Orders.findAll({
                where: {
                    storeId,
                    createdAt: { [Op.between]: [range.from, range.to] }
                },
                attributes: ['id', 'totalAmount']
            });
            result.ordersCount = ordersInRange.length;
            result.totalOrderAmount = ordersInRange.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const AdmingetDasboard = async (req, res) => {
    const query = req.query || getRequestParser(req) || {};
    const fromDate = query.fromDate ?? query.from;
    const toDate = query.toDate ?? query.to;
    const user = await User.findOne({
        where: { id: req.session.userId }
    });
    if (!user) return res.status(403).json({ msg: "User id not found" });
    try {
        let productCount = await Products.findAll({ attributes: ['id'] });
        let categoryCount = await Category.findAll({ attributes: ['id'] });
        let vendorCount = await Users.findAll({
            where: { role: "vendor" },
            attributes: ['id']
        });
        let customerCount = await Users.findAll({
            where: { role: "customer" },
            attributes: ['id']
        });
        let stores = await Stores.findAll({ attributes: ['id'] });
        let result = {
            productCount: productCount.length,
            categoryCount: categoryCount.length,
            vendorCount: vendorCount.length,
            customerCount: customerCount.length,
            storesCount: stores.length,
            ordersCount: 0,
            totalOrderAmount: 0
        };
        const range = parseDateRange(fromDate, toDate);
        if (range) {
            const ordersInRange = await Orders.findAll({
                where: {
                    createdAt: { [Op.between]: [range.from, range.to] }
                },
                attributes: ['id', 'totalAmount']
            });
            result.ordersCount = ordersInRange.length;
            result.totalOrderAmount = ordersInRange.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}