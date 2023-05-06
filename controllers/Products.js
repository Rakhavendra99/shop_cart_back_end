import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";
import { getParamsParser, getRole, getStoreId, postRequestParser } from "../util/index.js";
import Stores from "../models/StoreModel.js";

export const getProducts = async (req, res) => {
    const role = getRole(req)
    const storeId = getStoreId(req)
    try {
        let where = role === "vendor" ? {
            storeId: storeId
        } : {}
        let response = await Product.findAll({ where, include: [{ model: Stores }] });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getProductById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const product = await Product.findOne({
            where: {
                id: data.id
            },
            include: [{ model: Category }]
        });
        if (!product) return res.status(403).json({ msg: "Product Id not found" });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createProduct = async (req, res) => {
    const storeId = getStoreId(req)
    const data = postRequestParser(req)
    try {
        let findProduct = await Product.findOne({
            where: {
                name: data.name,
                storeId: storeId
            }
        })
        if (findProduct) {
            return res.status(403).json({ msg: "Product Name Already taken" });
        }
        data.isActive = 1
        data.storeId = storeId
        let product = await Product.create(Object.assign({}, data));
        return res.status(201).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateProduct = async (req, res) => {
    const params = getParamsParser(req)
    const data = postRequestParser(req)
    try {
        const product = await Product.findOne({
            where: {
                id: params.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Product not found" });
        await product.update(Object.assign({}, data))
        res.status(200).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    const params = getParamsParser(req)
    try {
        const product = await Product.findOne({
            where: {
                id: params.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Product id not found" });
        await product.destroy(Object.assign({}, params))
        res.status(200).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getProductCategory = async (req, res) => {
    const role = getRole(req)
    const storeId = getStoreId(req)
    try {
        let response = await Category.findAll({
            where: {
                storeId: storeId,
                isActive: 1
            },
            attributes: ['id', 'name'],
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getCustomerProducts = async (req, res) => {
    try {
        let response = await Product.findAll({
            where: {
                isActive: 1
            },
            include: [
                { model: Category, },
                {
                    model: Stores,
                    where: {
                        isActive: 1
                    }
                }]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getCustomerProductById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const product = await Product.findOne({
            where: {
                id: data.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Product Id not found" });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}