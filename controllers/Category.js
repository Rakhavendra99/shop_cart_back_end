import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";

export const getCategorys = async (req, res) => {
    try {
        let response = await Category.findAll({
            attributes: ['id', 'name', 'userId', 'storeId'],
            where: {
                userId: req.userId
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getCategoryById = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Product id not found" });
        let response;
        if (req.role === "admin") {
            response = await Product.findOne({
                attributes: ['id', 'name', 'price'],
                where: {
                    id: product.id
                },
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            });
        } else {
            response = await Product.findOne({
                attributes: ['id', 'name', 'price'],
                where: {
                    [Op.and]: [{ id: product.id }, { userId: req.userId }]
                },
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            });
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createCategory = async (req, res) => {
    const { name, price } = req.body;
    try {
        let findProduct = await Product.findOne({
            where: {
                name: name
            }
        })
        if (findProduct) {
            return res.status(403).json({ msg: "Product Name Already taken" });
        }
        let product = await Product.create({
            name: name,
            price: price,
            userId: req.userId
        });
        return res.status(201).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Product not found" });
        const { name, price } = req.body;
        // const findProduct = await Product.findOne({
        //     where:{
        //         name: name
        //     }
        // })
        // if(findProduct) return res.status(403).json({msg: "Product Name Already taken"})
        if (req.role === "admin") {
            await Product.update({ name, price }, {
                where: {
                    id: product.id
                }
            });
        } else {
            if (req.userId !== product.userId) return res.status(403).json({ msg: "Request Unauthorized" });
            await Product.update({ name, price }, {
                where: {
                    [Op.and]: [{ id: product.id }, { userId: req.userId }]
                }
            });
        }
        res.status(200).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!product) return res.status(403).json({ msg: "Produt id not found" });
        const { name, price } = req.body;
        let deleteProduct
        if (req.role === "admin") {
            deleteProduct = await Product.destroy({
                where: {
                    id: product.id
                }
            });
        } else {
            if (req.userId !== product.userId) return res.status(403).json({ msg: "Request Unauthorized" });
            deleteProduct = await Product.destroy({
                where: {
                    [Op.and]: [{ id: product.id }, { userId: req.userId }]
                }
            });
        }
        res.status(200).json({ msg: deleteProduct });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}