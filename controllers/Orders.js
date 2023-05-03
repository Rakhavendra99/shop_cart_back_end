import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import { Op } from "sequelize";
import { OrderStatus, getParamsParser, getRequestParser, getStoreId, postRequestParser } from "../util/index.js";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";
import Orders from "../models/OrderModel.js";
import OrderItems from "../models/OrderItems.js";
import Products from "../models/ProductModel.js";

export const calculateTotalAmount = (CartItems) => {
    try {
        //TotalAmount calculation
        let totalAmount = 0
        CartItems && CartItems.forEach((item) => {
            let quantity = item.quantity
            let unitPrice = item.product.price
            let amount = quantity * unitPrice
            totalAmount = totalAmount + amount
        });

        //TotalTax  calculation
        let totalTax = []
        let totalTaxAmount = 0
        CartItems && CartItems.forEach((item) => {
            let quantity = item.quantity
            let productgst = item.product.gst
            let price = item.product.price
            let tax = (productgst) * price / 100
            let taxAmount = totalAmount * tax
            totalTax.push(taxAmount)
            totalTaxAmount += taxAmount
        })
        return totalAmount + totalTaxAmount
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

//Calculate the total tax.
export const calculateTotalTax = (CartItems) => {
    try {
        //TotalTax  calculation
        let totalTax = []
        let totalTaxAmount = 0
        CartItems && CartItems.forEach((item) => {
            let quantity = item.quantity
            let productgst = item.product.gst
            let price = item.product.price
            let tax = (productgst) * price / 100
            let taxAmount = quantity * tax
            totalTax.push(taxAmount)
            totalTaxAmount += taxAmount
        })
        return totalTaxAmount
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

//Calculate the total amount excluding tax.
export const calculateTotalAmountExcludingTax = (CartItems) => {
    try {
        let totalAmount = 0
        CartItems && CartItems.forEach((item) => {
            let quantity = item.quantity
            let unitPrice = item.product.price
            let amount = quantity * unitPrice
            totalAmount = totalAmount + amount
        });
        return totalAmount
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createOrder = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let payment = {}
        let cart = await Cart.findOne({
            where: {
                id: data.cartId
            }
        })
        let CartItems = await CartItem.findAll({
            where: {
                cartId: data.cartId
            },
            include: Product,
        })
        let totalAmount = await calculateTotalAmount(CartItems)
        let totalTaxAmount = await calculateTotalTax(CartItems)
        let totalAmountExcludingTax = await calculateTotalAmountExcludingTax(CartItems)
        let findQuantity = []
        let findActive = []
        await CartItems && CartItems.forEach(async (o) => {
            if (o.product.isActive == 0) {
                findQuantity.push(1)
                findActive.push(1)
            } else {
                findQuantity = []
            }
        })
        if (findActive.length >= 1) {
            return res.status(403).json({ msg: "The selected product is not available right now, so you cannot place the order." });
        }
        let userData = {}
        userData.role = "customer"
        userData.email = data.email
        userData.name = data.name
        userData.phone = data.phone
        if (totalAmount <= 0) {
            return res.status(403).json({ msg: "The payment cannot be done for this amount" });
        } else {
            let getUser = await Users.findOne({
                where: {
                    // phone: data.phone,
                    email: data.email,
                }
            })
            const User = getUser && getUser.toJSON()
            if (!User) {
                let orderItem = {}
                let createUser = await Users.create(Object.assign({}, userData))
                let totalAmount = 0
                totalAmount = CartItems.reduce(function (previousValue, currentValue) {
                    return previousValue + currentValue.quantity * currentValue.product.price;
                }, 0);
                let order = {}
                let tax = 0
                CartItems && CartItems.forEach(item => {
                    tax += item.product.gst
                })
                order.status = OrderStatus.ORDER_INITIATE
                order.totalAmount = totalAmount
                order.totalTaxAmount = tax
                order.totalAmountExcludingTax = totalAmount
                order.address = data.address
                order.userId = createUser.id
                order.orderType = data.orderType
                order.storeId = data.storeId
                order.isActive = 1
                let createOrder = await Orders.create(Object.assign({}, order))
                CartItems && CartItems.forEach(async obj => {
                    orderItem.orderId = createOrder.id
                    orderItem.productId = obj.productId
                    orderItem.quantity = obj.quantity
                    orderItem.productPrice = obj.product.price
                    orderItem.orderType = data.orderType
                    orderItem.gst = obj.product.gst
                    await OrderItems.create(Object.assign({}, orderItem))
                    let findProducts = await Products.findOne({
                        where: {
                            id: obj.productId
                        },
                        attributes: ['id', 'name']
                    })
                });
                await cart && cart.update({ isActive: 0 })
                return res.status(201).json({ msg: createOrder });

            } else {
                // if (!User.phone) {
                //     return res.status(403).json({ msg: "Please enter your Mobile number." });
                // } else
                if (!User.name) {
                    return res.status(403).json({ msg: "Please enter your name." });
                } else if (!User.email) {
                    return res.status(403).json({ msg: "TPlease enter your email id." });
                } else {
                    let orderItem = {}
                    let totalAmount = 0
                    totalAmount = CartItems.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue.quantity * currentValue.product.price;
                    }, 0);
                    let order = {}
                    let tax = 0
                    CartItems && CartItems.forEach(item => {
                        tax += item.product.gst
                    })
                    order.status = OrderStatus.ORDER_INITIATE
                    order.totalAmount = totalAmount
                    order.totalTaxAmount = tax
                    order.totalAmountExcludingTax = totalAmount
                    order.address = data.address
                    order.userId = User.id
                    order.orderType = data.orderType
                    order.storeId = data.storeId
                    order.isActive = 1
                    let createOrder = await Orders.create(Object.assign({}, order))
                    CartItems && CartItems.forEach(async obj => {
                        orderItem.orderId = createOrder.id
                        orderItem.productId = obj.productId
                        orderItem.quantity = obj.quantity
                        orderItem.productPrice = obj.product.price
                        orderItem.orderType = data.orderType
                        orderItem.gst = obj.product.gst
                        await OrderItems.create(Object.assign({}, orderItem))
                        let findProducts = await Products.findOne({
                            where: {
                                id: obj.productId
                            },
                            attributes: ['id', 'name']
                        })
                    });
                    await cart && cart.update({ isActive: 0 })
                    return res.status(201).json({ msg: createOrder });

                }
            }
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}