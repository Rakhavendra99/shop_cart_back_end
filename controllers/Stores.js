import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";
import { getParamsParser, postRequestParser } from "../util/index.js";
import Stores from "../models/StoreModel.js";

export const getStores = async (req, res) => {
    try {
        let response = await Stores.findAll();
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
            }
        });
        if (!product) return res.status(403).json({ msg: "Product Id not found" });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createStore = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let findStore = await Stores.findOne({
            where: {
                name: data.name
            }
        })
        if (findStore) {
            return res.status(403).json({ msg: "Store Name Already taken" });
        }
        data.isActive = 1
        let product = await Stores.create(Object.assign({}, data));
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
    try {
        let response = await Category.findAll({
            attributes: ['id', 'name'],
            where: {
                isActive: 1
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getCustomerProducts = async (req, res) => {
    try {
        let response = await Product.findAll({
            include: Category
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