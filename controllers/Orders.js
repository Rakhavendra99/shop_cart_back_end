import Product from "../models/ProductModel.js";
import { Op } from "sequelize";
import {
    OrderStatus,
    CookingWorkflowStatus,
    getParamsParser,
    getRequestParser,
    getRole,
    getStoreId,
    postRequestParser,
} from "../util/index.js";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";
import Orders from "../models/OrderModel.js";
import OrderItems from "../models/OrderItems.js";
import Products from "../models/ProductModel.js";
import Payments from "../models/PaymentModel.js";
import { isStoreOpen } from "../util/storeHelpers.js";
import { resolveCookingServiceFee, emitOrderCreatedSockets } from "../util/cookingOrderHelpers.js";
import Vendor from "../models/VendorModel.js";
import VendorType from "../models/VendorTypeModel.js";

const PAYMENT_METHOD = { STRIPE: "stripe", COD: "cod", COOKING_FEE: "cooking_fee" };
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

/**
 * Creates order, line items, payments (products + optional pending cooking fee), decrements stock, notifies sockets.
 * `totalAmount` on the order row = products + tax only; cooking fee is stored on order.cookingServiceFee + second payment row.
 */
export async function finalizeCheckoutOrder({
    userId,
    data,
    CartItems,
    cart,
    productPaymentMethod,
    stripePaymentIntentId,
}) {
    const totalTaxAmount = calculateTotalTax(CartItems);
    const totalAmountExcludingTax = calculateTotalAmountExcludingTax(CartItems);
    const productTotal = totalAmountExcludingTax + totalTaxAmount;
    const cv = data.cookingVendorId ? parseInt(String(data.cookingVendorId), 10) : null;
    const cooking = await resolveCookingServiceFee(cv);
    const orderPayload = {
        status: OrderStatus.ORDER_INITIATE,
        totalAmount: productTotal,
        totalTaxAmount,
        address: data.address,
        userId,
        orderType: data.orderType,
        storeId: data.storeId,
        cookingVendorId: cv || null,
        cookingWorkflowStatus: cooking.cookingWorkflowStatus,
        cookingServiceFee: cooking.cookingServiceFee,
        isActive: 1,
    };
    const createOrder = await Orders.create(orderPayload);
    const orderItem = {};
    for (const obj of CartItems) {
        orderItem.orderId = createOrder.id;
        orderItem.productId = obj.productId;
        orderItem.quantity = obj.quantity;
        orderItem.productPrice = obj.product.price;
        orderItem.orderType = data.orderType;
        orderItem.gst = obj.product.gst;
        await OrderItems.create(Object.assign({}, orderItem));
        await Products.decrement("availableQuantity", { by: obj.quantity, where: { id: obj.productId } });
    }
    await cart.update({ isActive: 0 });
    const productPayStatus =
        productPaymentMethod === PAYMENT_METHOD.STRIPE ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.PENDING;
    await Payments.create({
        orderId: createOrder.id,
        payment_method: productPaymentMethod,
        payment_status: productPayStatus,
        transaction_reference: stripePaymentIntentId || null,
        amount: productTotal,
    });
    if (cooking.cookingServiceFee && cooking.cookingServiceFee > 0) {
        await Payments.create({
            orderId: createOrder.id,
            payment_method: PAYMENT_METHOD.COOKING_FEE,
            payment_status: PAYMENT_STATUS.PENDING,
            transaction_reference: null,
            amount: cooking.cookingServiceFee,
        });
    }
    await emitOrderCreatedSockets(createOrder);
    return createOrder;
}

export const createOrder = async (req, res) => {
    const data = postRequestParser(req);
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
            where: { id: data.cartId },
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
        let findActive = [];
        let insufficientStock = [];
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
        let totalTaxAmount = calculateTotalTax(CartItems);
        let totalAmountExcludingTax = calculateTotalAmountExcludingTax(CartItems);
        let productTotal = totalAmountExcludingTax + totalTaxAmount;
        let userData = {};
        userData.role = "customer";
        userData.email = data.email;
        userData.name = data.name;
        userData.phone = data.phone;
        userData.isActive = 1;
        if (productTotal <= 0) {
            return res.status(403).json({ msg: "The payment cannot be done for this amount" });
        }
        let getUser = await Users.findOne({
            where: {
                phone: data.phone,
                email: data.email,
            },
        });
        const UserRow = getUser && getUser.toJSON();
        if (!UserRow) {
            let createUser = await Users.create(Object.assign({}, userData));
            const newOrder = await finalizeCheckoutOrder({
                userId: createUser.id,
                data,
                CartItems,
                cart,
                productPaymentMethod: PAYMENT_METHOD.COD,
                stripePaymentIntentId: null,
            });
            return res.status(201).json({ msg: newOrder });
        }
        if (!UserRow.name) {
            return res.status(403).json({ msg: "Please enter your name." });
        }
        if (!UserRow.email) {
            return res.status(403).json({ msg: "TPlease enter your email id." });
        }
        const newOrder = await finalizeCheckoutOrder({
            userId: UserRow.id,
            data,
            CartItems,
            cart,
            productPaymentMethod: PAYMENT_METHOD.COD,
            stripePaymentIntentId: null,
        });
        return res.status(201).json({ msg: newOrder });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
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
            const cookingProfile = await Vendor.findOne({
                where: { userId: req.session.userId },
            });
            let isCookingVendor = false;
            if (cookingProfile) {
                const t = await VendorType.findByPk(cookingProfile.vendorTypeId, { attributes: ["code"] });
                isCookingVendor = t?.code === "cooking_vendor";
            }
            if (isCookingVendor) {
                where.cookingVendorId = cookingProfile.id;
            } else {
                if (storeId == null || storeId === "") {
                    return res.status(403).json({ msg: "Store not found. Please log in again." });
                }
                where.storeId = storeId;
            }
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
    const data = getParamsParser(req);
    try {
        let Order = await Orders.findOne({
            where: { id: data.id },
            include: [Users],
        });
        if (!Order) return res.status(403).json({ msg: "Order Id not found" });
        const OrderItem = await OrderItems.findAll({
            where: { orderId: Order.id },
            include: [Products],
        });
        const paymentRows = await Payments.findAll({ where: { orderId: Order.id } });
        let cookingVendor = null;
        if (Order.cookingVendorId) {
            cookingVendor = await Vendor.findByPk(Order.cookingVendorId, {
                attributes: ["id", "name", "location", "cookingDescription", "availableTimeSlots"],
            });
        }
        Order = Order.toJSON();
        Order.OrderItems = OrderItem;
        Order.payments = paymentRows.map((p) => (p.toJSON ? p.toJSON() : p));
        const productTotal = Number(Order.totalAmount) || 0;
        const tax = Number(Order.totalTaxAmount) || 0;
        const fee = Number(Order.cookingServiceFee) || 0;
        const cookingPayment = paymentRows.find((p) => p.payment_method === PAYMENT_METHOD.COOKING_FEE);
        const cookingFeePaid =
            cookingPayment && String(cookingPayment.payment_status).toUpperCase() === PAYMENT_STATUS.SUCCESS;
        Order.invoice = {
            productSubtotalExTax: Math.max(0, productTotal - tax),
            taxAmount: tax,
            productsAndTaxTotal: productTotal,
            cookingServiceFee: fee,
            grandTotal: productTotal + fee,
            cookingFeePaid,
            balanceDueCooking: fee > 0 && !cookingFeePaid ? fee : 0,
        };
        Order.cookingVendor = cookingVendor ? cookingVendor.toJSON() : null;
        res.status(200).json(Order);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateOrder = async (req, res) => {
    const params = getParamsParser(req);
    const data = postRequestParser(req);
    try {
        const findOrder = await Orders.findOne({
            where: { id: params.id },
        });
        if (!findOrder) return res.status(403).json({ msg: "Order Id not found" });

        const requestRole = getRole(req);

        if (data.markCookingFeePaid) {
            if (requestRole !== "admin" && requestRole !== "vendor") {
                return res.status(403).json({ msg: "Not allowed to record cooking payment" });
            }
            if (requestRole === "vendor") {
                const sid = getStoreId(req);
                if (Number(findOrder.storeId) !== Number(sid)) {
                    return res.status(403).json({ msg: "Not your store order" });
                }
            }
            const cookingPay = await Payments.findOne({
                where: { orderId: findOrder.id, payment_method: PAYMENT_METHOD.COOKING_FEE },
            });
            if (!cookingPay) {
                return res.status(400).json({ msg: "No cooking fee line on this order" });
            }
            await cookingPay.update({
                payment_status: PAYMENT_STATUS.SUCCESS,
                transaction_reference: data.cookingFeeReference || "cod_collected",
            });
            delete data.markCookingFeePaid;
            delete data.cookingFeeReference;
        }

        if (data.status === OrderStatus.ORDER_ACCEPTED) {
            if (
                findOrder.cookingVendorId &&
                findOrder.cookingWorkflowStatus != null &&
                findOrder.cookingWorkflowStatus !== CookingWorkflowStatus.COOKING_DONE
            ) {
                return res.status(403).json({
                    msg: "Wait until the cooking partner marks this order complete before you accept.",
                });
            }
        }

        if (requestRole !== "admin") {
            delete data.cookingWorkflowStatus;
            delete data.cookingVendorId;
            delete data.cookingServiceFee;
            delete data.cookingStartedAt;
            delete data.cookingCompletedAt;
        }

        await findOrder.update(Object.assign({}, data));
        await findOrder.reload();
        res.status(200).json({ msg: findOrder });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
