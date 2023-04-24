import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";
import { getParamsParser, postRequestParser } from "../util/index.js";

export const getProducts = async (req, res) => {
    try {
        let response = await Product.findAll({
            where: {
                storeId: 1
            }
        });
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

export const createProduct = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let findProduct = await Product.findOne({
            where: {
                name: data.name
            }
        })
        if (findProduct) {
            return res.status(403).json({ msg: "Product Name Already taken" });
        }
        data.isActive = 1
        data.storeId = 1
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