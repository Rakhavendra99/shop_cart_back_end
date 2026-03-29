import Stripe from "stripe";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";
import Product from "../models/ProductModel.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";
import Orders from "../models/OrderModel.js";
import OrderItems from "../models/OrderItems.js";
import Payments from "../models/PaymentModel.js";
import Products from "../models/ProductModel.js";
import { OrderStatus } from "../util/index.js";
import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";
import { calculateTotalTax, calculateTotalAmountExcludingTax } from "./Orders.js";
import { isStoreOpen } from "../util/storeHelpers.js";
import config from "../config/index.js";

const stripeSecret = config.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;
const webhookSecretFromConfig = config.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
  : null;
  
const PAYMENT_STATUS = {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    PENDING: "PENDING",
    PAID: "PAID"
};

const PAYMENT_METHOD = {
    STRIPE: "stripe",
    COD: "cod"
};

/**
 * Create Stripe Payment Intent - used before redirecting user to Stripe Checkout
 * Order is NOT created here - only after webhook confirms payment
 */
export const createPaymentIntent = async (req, res) => {
    const data = req.body;
    try {
        if (!stripe) {
            return res.status(500).json({ msg: "Stripe is not configured. Please contact support." });
        }
        if (!data.storeId || !data.cartId) {
            return res.status(403).json({ msg: "Store Id or Cart not found. Please refresh the page." });
        }
        const cart = await Cart.findOne({ where: { id: data.cartId } });
        if (!cart || cart.isActive !== 1) {
            return res.status(403).json({ msg: "Cart not found or already used." });
        }
        if (Number(cart.storeId) !== Number(data.storeId)) {
            return res.status(403).json({ msg: "Cart does not match store." });
        }
        const store = await Stores.findOne({ where: { id: data.storeId } });
        if (store && !isStoreOpen(store)) {
            return res.status(403).json({ msg: "Store is currently closed." });
        }
        const CartItems = await CartItem.findAll({
            where: { cartId: data.cartId },
            include: Product,
        });
        if (!CartItems || CartItems.length === 0) {
            return res.status(403).json({ msg: "Cart is empty." });
        }
        const totalTaxAmount = calculateTotalTax(CartItems);
        const totalAmountExcludingTax = calculateTotalAmountExcludingTax(CartItems);
        const totalAmount = totalAmountExcludingTax + totalTaxAmount;
        if (totalAmount <= 0) {
            return res.status(403).json({ msg: "Invalid amount for payment." });
        }
        const amountInCents = Math.round(totalAmount * 100);
        const metadata = {
            cartId: String(data.cartId),
            storeId: String(data.storeId),
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            orderType: String(data.orderType || 1),
            cookingVendorId: data.cookingVendorId ? String(data.cookingVendorId) : "",
        };
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "inr",
            automatic_payment_methods: { enabled: true },
            metadata,
        });
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Stripe createPaymentIntent error:", error);
        return res.status(500).json({ msg: error.message || "Payment setup failed." });
    }
};

/**
 * Stripe Webhook - handles payment_intent.succeeded
 * Creates order and payment record ONLY after payment success
 */
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = webhookSecretFromConfig;
    let event;
    try {
        if (!stripe || !webhookSecret) {
            console.error("Stripe or STRIPE_WEBHOOK_SECRET not set");
            return res.status(500).send("Webhook secret not configured");
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type !== "payment_intent.succeeded") {
        return res.status(200).json({ received: true });
    }
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};
    const cartId = metadata.cartId;
    const storeId = metadata.storeId;
    if (!cartId || !storeId) {
        console.error("Webhook: missing cartId or storeId in metadata");
        return res.status(400).send("Invalid metadata");
    }
    try {
        const cart = await Cart.findOne({ where: { id: cartId } });
        if (!cart) {
            console.error("Webhook: cart not found", cartId);
            return res.status(200).json({ received: true });
        }
        if (cart.isActive !== 1) {
            return res.status(200).json({ received: true });
        }
        const CartItems = await CartItem.findAll({
            where: { cartId },
            include: Product,
        });
        if (!CartItems || CartItems.length === 0) {
            return res.status(200).json({ received: true });
        }
        const totalTaxAmount = calculateTotalTax(CartItems);
        const totalAmountExcludingTax = calculateTotalAmountExcludingTax(CartItems);
        const totalAmount = totalAmountExcludingTax + totalTaxAmount;
        let getUser = await Users.findOne({
            where: {
                phone: metadata.phone,
                email: metadata.email,
            },
        });
        let userId;
        if (!getUser) {
            const createUser = await Users.create({
                role: "customer",
                email: metadata.email,
                name: metadata.name,
                phone: metadata.phone,
                isActive: 1,
            });
            userId = createUser.id;
        } else {
            userId = getUser.id;
        }
        const order = {
            status: OrderStatus.ORDER_INITIATE,
            totalAmount,
            totalTaxAmount,
            address: metadata.address,
            userId,
            orderType: parseInt(metadata.orderType || "1", 10),
            storeId: parseInt(storeId, 10),
            cookingVendorId: metadata.cookingVendorId ? parseInt(metadata.cookingVendorId, 10) : null,
            isActive: 1,
        };
        const createOrder = await Orders.create(order);
        const orderItem = {};
        for (const obj of CartItems) {
            orderItem.orderId = createOrder.id;
            orderItem.productId = obj.productId;
            orderItem.quantity = obj.quantity;
            orderItem.productPrice = obj.product.price;
            orderItem.orderType = parseInt(metadata.orderType || "1", 10);
            orderItem.gst = obj.product.gst;
            await OrderItems.create({ ...orderItem });
            await Products.decrement("availableQuantity", { by: obj.quantity, where: { id: obj.productId } });
        }
        await cart.update({ isActive: 0 });
        await Payments.create({
            orderId: createOrder.id,
            payment_method: PAYMENT_METHOD.STRIPE,
            payment_status: PAYMENT_STATUS.SUCCESS,
            transaction_reference: paymentIntent.id,
            amount: totalAmount,
        });
        const vendorSubscriptionUrl = await VendorSubscriptionURL(2);
        const CustomerToVendor = createOrder.toJSON();
        CustomerToVendor.type = "NEW_ORDER";
        await EmitToSocketPost({
            url: vendorSubscriptionUrl,
            response: CustomerToVendor,
        });
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error("Webhook order creation error:", error);
        return res.status(500).json({ msg: error.message });
    }
};
