import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";
import { getParamsParser, getRequestParser, getStoreId, postRequestParser } from "../util/index.js";

export const getCategorys = async (req, res) => {
    const storeId = getStoreId(req)
    try {
        let response = await Category.findAll({
            where: {
                storeId: storeId
            },
            attributes: ['id', 'name', 'isActive', 'storeId', "image"],
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getCategoryById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const category = await Category.findOne({
            where: {
                id: data.id
            }
        });
        if (!category) return res.status(403).json({ msg: "Category Id not found" });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createCategory = async (req, res) => {
    const data = postRequestParser(req)
    const storeId = getStoreId(req)
    try {
        let findCategory = await Category.findOne({
            where: {
                name: data.name,
                storeId: storeId
            }
        })
        if (findCategory) {
            return res.status(403).json({ msg: "Category Name Already taken" });
        }
        data.isActive = 1
        data.storeId = storeId
        let category = await Category.create(Object.assign({}, data));
        return res.status(201).json({ msg: category });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateCategory = async (req, res) => {
    const params = getParamsParser(req)
    const data = postRequestParser(req)
    try {
        const category = await Category.findOne({
            where: {
                id: params.id
            }
        });
        if (!category) return res.status(403).json({ msg: "Cagtegory Id Not found" });
        await category.update(Object.assign({}, data));
        res.status(200).json({ msg: category });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const category = await Category.findOne({
            where: {
                id: data.id
            }
        });
        if (!category) return res.status(403).json({ msg: "Category Id not found" });
        let findProduct = await Product.findOne({
            where: {
                categoryId: data.id,
            }
        })
        if (findProduct) {
            return res.status(403).json({ msg: "There is one valid product in this category. So you can't delete it." });
        }
        category.destroy(Object.assign({}, data))
        res.status(200).json({ msg: category });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}