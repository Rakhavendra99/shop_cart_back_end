import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import { Op } from "sequelize";
import { getParamsParser, getRequestParser, postRequestParser } from "../util/index.js";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";

export const getCartById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const cart = await Cart.findOne({
            where: {
                id: data.id
            },
            // include: CartItem
        });
        console.log(cart);
        if (cart && cart.id) {
            //total cart calculation
            let totalCarts = 0
            cart && cart.CartItems.forEach((item) => {
                let quantity = item.quantity
                totalCarts = totalCarts + quantity
            })

            //Product amount calculation
            let productAmount = []
            cart && cart.CartItems.forEach((item) => {
                let quantity = item.quantity
                let unitPrice = item.Product.productPrice
                let amount = quantity * unitPrice
                productAmount.push(amount)
            })

            //TotalAmount calculation
            let totalAmount = 0
            cart && cart.CartItems.forEach((item) => {
                let quantity = item.quantity
                let unitPrice = item.Product.productPrice
                let amount = quantity * unitPrice
                totalAmount = totalAmount + amount
            });

            //TotalTax  calculation
            let totalTax = []
            let totalTaxAmount = 0
            cart && cart.CartItems.forEach((item) => {
                let quantity = item.quantity
                let productCgst = item.Product.prodcutCgst
                let prodcutSgst = item.Product.prodcutSgst
                let price = item.Product.productPrice
                let tax = (productCgst + prodcutSgst) * price / 100
                let taxAmount = quantity * tax
                totalTax.push(taxAmount)
                totalTaxAmount += taxAmount
            })
            let tax = totalAmount * CartConstant.OverAllTax
            let cartData = cart.toJSON();
            let cartDetails = {}
            cartDetails["id"] = cartData.id
            cartDetails["createdAt"] = cartData.createdAt
            cartDetails["userId"] = cartData.userId
            cartDetails["storeId"] = cartData.storeId
            cartDetails["active"] = cartData.active
            cartDetails["CartItems"] = cartData.CartItems
            cartDetails["totalItems"] = totalCarts
            cartDetails["tax"] = tax
            cartDetails["totalAmount"] = totalAmount + tax
            cartDetails["subTotal"] = totalAmount
            cartDetails["productAmount"] = productAmount
            return ResponseHandler.success(methodName, cartDetails)
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createCart = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let findCategory = await Cart.findOne({
            where: {
                name: data.name
            }
        })
        if (findCategory) {
            return res.status(403).json({ msg: "Category Name Already taken" });
        }
        data.isActive = 1
        data.storeId = 1
        let category = await Category.create(Object.assign({}, data));
        return res.status(201).json({ msg: category });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteCart = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const category = await Cart.findOne({
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
        if(findProduct){
            return res.status(403).json({ msg: "There is one valid product in this category. So you can't delete it." });
        }
        category.destroy(Object.assign({}, data))
        res.status(200).json({ msg: category });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}