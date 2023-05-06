import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";
import { Op } from "sequelize";
import { OrderStatus, getParamsParser, getRequestParser, getRole, getStoreId, postRequestParser } from "../util/index.js";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";
import Orders from "../models/OrderModel.js";
import OrderItems from "../models/OrderItems.js";
import Products from "../models/ProductModel.js";
import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";

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
        if(!data.storeId){
            return res.status(403).json({ msg: "Store Id Not found Plese refresh the page." });
        }
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
        userData.isActive = 1
        if (totalAmount <= 0) {
            return res.status(403).json({ msg: "The payment cannot be done for this amount" });
        } else {
            let getUser = await Users.findOne({
                where: {
                    phone: data.phone,
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
                let vendorSubscriptionUrl = await VendorSubscriptionURL(2)
                let CustomerToVendor = createOrder && createOrder.toJSON()
                CustomerToVendor.type = "NEW_ORDER"
                let VendorSocketResponse = {
                    url: vendorSubscriptionUrl,
                    response: CustomerToVendor
                }
                await EmitToSocketPost(VendorSocketResponse)
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
                    let vendorSubscriptionUrl = await VendorSubscriptionURL(2)
                    let CustomerToVendor = createOrder && createOrder.toJSON()
                    CustomerToVendor.type = "NEW_ORDER"
                    let VendorSocketResponse = {
                        url: vendorSubscriptionUrl,
                        response: CustomerToVendor
                    }
                    await EmitToSocketPost(VendorSocketResponse)
                    return res.status(201).json({ msg: createOrder });

                }
            }
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getOrders = async (req, res) => {
    const storeId = getStoreId(req)
    const role = getRole(req)
    try {
        let where = role === "vendor" ? {
            storeId: storeId
        } : {}
        let response = await Orders.findAll({
            where,
            include: Users
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getOrderById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        let Order = await Orders.findOne({
            where: {
                id: data.id
            },
            include: Users,
        });
        if (!Order) return res.status(403).json({ msg: "Order Id not found" });
        const OrderItem = await OrderItems.findAll({
            where: {
                orderId: Order.id
            },
            include: Products
        })
        Order = Order.toJSON()
        Order.OrderItems = OrderItem
        res.status(200).json(Order);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const updateOrder = async (req, res) => {
    const params = getParamsParser(req)
    const data = postRequestParser(req)
    try {
        const findOrder = await Orders.findOne({
            where: {
                id: params.id
            }
        });
        if (!findOrder) return res.status(403).json({ msg: "Order Id not found" });
        await findOrder.update(Object.assign({}, data))
        res.status(200).json({ msg: findOrder });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
