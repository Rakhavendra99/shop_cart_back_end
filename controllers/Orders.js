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
import Payments from "../models/PaymentModel.js";
import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";
import { isStoreOpen } from "../util/storeHelpers.js";

const PAYMENT_METHOD = { STRIPE: "stripe", COD: "cod" };
const PAYMENT_STATUS = { SUCCESS: "SUCCESS", FAILED: "FAILED", PENDING: "PENDING", PAID: "PAID" };

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
            let taxAmount = quantity * tax
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
        const paymentMethod = (data.payment_method || "cod").toLowerCase();
        if (paymentMethod !== PAYMENT_METHOD.COD) {
            return res.status(403).json({ msg: "Use Stripe Pay Now for online payment. This endpoint is for Cash on Delivery only." });
        }
        if (!data.storeId) {
            return res.status(403).json({ msg: "Store Id Not found. Please refresh the page." });
        }
        if (!data.cartId) {
            return res.status(403).json({ msg: "Cart not found. Please add items and try again." });
        }
        let cart = await Cart.findOne({
            where: { id: data.cartId }
        });
        if (!cart) {
            return res.status(403).json({ msg: "Cart not found." });
        }
        if (cart.isActive !== 1) {
            return res.status(403).json({ msg: "This cart was already used for an order. Please use a new cart." });
        }
        if (Number(cart.storeId) !== Number(data.storeId)) {
            return res.status(403).json({ msg: "Cart does not match store. Please refresh and try again." });
        }
        let store = await Stores.findOne({ where: { id: data.storeId } });
        if (store && !isStoreOpen(store)) {
            return res.status(403).json({ msg: "Store is currently closed. You cannot place an order." });
        }
        let CartItems = await CartItem.findAll({
            where: { cartId: data.cartId },
            include: Product,
        });
        if (!CartItems || CartItems.length === 0) {
            return res.status(403).json({ msg: "Cart is empty. Please add items before placing an order." });
        }
        let findActive = []
        let insufficientStock = []
        CartItems.forEach((o) => {
            if (o.product.isActive == 0) findActive.push(1);
            else if (o.product.availableQuantity != null && o.quantity > o.product.availableQuantity) {
                insufficientStock.push({ name: o.product.name, available: o.product.availableQuantity, requested: o.quantity });
            }
        });
        if (findActive.length >= 1) {
            return res.status(403).json({ msg: "The selected product is not available right now, so you cannot place the order." });
        }
        if (insufficientStock.length > 0) {
            const first = insufficientStock[0];
            return res.status(403).json({ msg: `Insufficient stock for "${first.name}". Only ${first.available} available, ${first.requested} requested.` });
        }
        let totalTaxAmount = await calculateTotalTax(CartItems);
        let totalAmountExcludingTax = await calculateTotalAmountExcludingTax(CartItems);
        let totalAmount = totalAmountExcludingTax + totalTaxAmount;
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
                let order = {}
                order.status = OrderStatus.ORDER_INITIATE
                order.totalAmount = totalAmount
                order.totalTaxAmount = totalTaxAmount
                order.address = data.address
                order.userId = createUser.id
                order.orderType = data.orderType
                order.storeId = data.storeId
                order.isActive = 1
                let createOrder = await Orders.create(Object.assign({}, order))
                for (const obj of CartItems) {
                    orderItem.orderId = createOrder.id
                    orderItem.productId = obj.productId
                    orderItem.quantity = obj.quantity
                    orderItem.productPrice = obj.product.price
                    orderItem.orderType = data.orderType
                    orderItem.gst = obj.product.gst
                    await OrderItems.create(Object.assign({}, orderItem))
                    await Products.decrement('availableQuantity', { by: obj.quantity, where: { id: obj.productId } })
                }
                await cart.update({ isActive: 0 })
                await Payments.create({
                    orderId: createOrder.id,
                    payment_method: PAYMENT_METHOD.COD,
                    payment_status: PAYMENT_STATUS.PENDING,
                    transaction_reference: null,
                    amount: totalAmount,
                });
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
                    let order = {}
                    order.status = OrderStatus.ORDER_INITIATE
                    order.totalAmount = totalAmount
                    order.totalTaxAmount = totalTaxAmount
                    order.address = data.address
                    order.userId = User.id
                    order.orderType = data.orderType
                    order.storeId = data.storeId
                    order.isActive = 1
                    let createOrder = await Orders.create(Object.assign({}, order))
                    for (const obj of CartItems) {
                        orderItem.orderId = createOrder.id
                        orderItem.productId = obj.productId
                        orderItem.quantity = obj.quantity
                        orderItem.productPrice = obj.product.price
                        orderItem.orderType = data.orderType
                        orderItem.gst = obj.product.gst
                        await OrderItems.create(Object.assign({}, orderItem))
                        await Products.decrement('availableQuantity', { by: obj.quantity, where: { id: obj.productId } })
                    }
                    await cart.update({ isActive: 0 })
                    await Payments.create({
                        orderId: createOrder.id,
                        payment_method: PAYMENT_METHOD.COD,
                        payment_status: PAYMENT_STATUS.PENDING,
                        transaction_reference: null,
                        amount: totalAmount,
                    });
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
/**
 * Parse YYYY-MM-DD strings to start-of-day and end-of-day in local time.
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

export const getOrders = async (req, res) => {
    try {
        const storeId = getStoreId(req);
        const role = getRole(req);
        const query = req.query || getRequestParser(req) || {};
        const fromDate = query.fromDate ?? query.from;
        const toDate = query.toDate ?? query.to;
        const range = parseDateRange(fromDate, toDate);
        if ((fromDate || toDate) && !range) {
            return res.status(400).json({ msg: "Invalid date range. Use fromDate and toDate as YYYY-MM-DD." });
        }
        const where = {};
        if (role === "vendor") {
            if (storeId == null || storeId === "") {
                return res.status(403).json({ msg: "Store not found. Please log in again." });
            }
            where.storeId = storeId;
        }
        if (range) {
            where.createdAt = { [Op.between]: [range.from, range.to] };
        }
        const response = await Orders.findAll({
            where,
            include: [Users],
            order: [["createdAt", "DESC"]]
        });
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ msg: error.message });
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
