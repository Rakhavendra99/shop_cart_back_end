import Product from "../models/ProductModel.js";
import { getParamsParser, postRequestParser } from "../util/index.js";
import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItem.js";
import Stores from "../models/StoreModel.js";
import { CustomerSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";
import { isStoreOpen } from "../util/storeHelpers.js";

export const getCartById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const cart = await Cart.findOne({
            where: {
                id: data.id,
                isActive: 1
            },
        });
        if (cart && cart.id) {
            let store = await Stores.findOne({
                where: {
                    id: cart.storeId
                }
            })
            //total cart calculation
            let totalCarts = 0
            let CartItems = await CartItem.findAll({
                where: {
                    cartId: data.id
                },
                include: Product,
            })
            CartItems && CartItems.forEach((item) => {
                let quantity = item.quantity
                totalCarts = totalCarts + quantity
            })
            //Product amount calculation
            let productAmount = []
            CartItems && CartItems.forEach((item) => {
                let quantity = item.quantity
                let unitPrice = item.product.price
                let amount = quantity * unitPrice
                productAmount.push(amount)
            })

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
            let tax = 0
            CartItems && CartItems.forEach(item => {
                tax += item.product.gst
            })
            let cartData = cart.toJSON();
            let cartDetails = {}
            cartDetails["id"] = cartData.id
            cartDetails["createdAt"] = cartData.createdAt
            cartDetails["userId"] = cartData.userId
            cartDetails["storeId"] = cartData.storeId
            cartDetails["store"] = store
            cartDetails["active"] = cartData.active
            cartDetails["CartItems"] = CartItems
            cartDetails["totalItems"] = totalCarts
            cartDetails["tax"] = tax
            cartDetails["totalAmount"] = totalAmount + tax
            cartDetails["subTotal"] = totalAmount
            cartDetails["productAmount"] = productAmount
            return res.status(201).json({ msg: cartDetails });
        }
        let cartDetails = {}
        cartDetails["Cart"] = null
        cartDetails["CartItems"] = []
        res.status(200).json({ msg: cartDetails });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createCart = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let { productId, quantity, cartId, storeId } = data
        const qty = quantity != null ? parseInt(quantity, 10) : NaN
        if (isNaN(qty) || qty < 0) {
            return res.status(403).json({ msg: "Invalid quantity. Use 0 to remove an item." });
        }
        if (qty > 0 && !storeId) {
            return res.status(403).json({ msg: "Store is required." });
        }
        let store = storeId ? await Stores.findOne({ where: { id: storeId } }) : null
        if (qty > 0 && store && !isStoreOpen(store)) {
            return res.status(403).json({ msg: "Store is currently closed." });
        }
        let findProduct = await Product.findOne({
            where: {
                id: productId,
                storeId: storeId,
                isActive: 1
            }
        })
        const productDetails = findProduct && findProduct.toJSON()
        if (!productDetails && qty !== 0) {
            return res.status(403).json({ msg: "The product is currently unavailable" });
        }
        if (qty > 0 && productDetails && (productDetails.availableQuantity == null || qty > productDetails.availableQuantity)) {
            return res.status(403).json({ msg: `Insufficient stock. Only ${productDetails.availableQuantity ?? 0} available.` });
        }
        if ((!cartId || cartId == "null") && productDetails) {
            data.createdAt = new Date();
            data.isActive = 1;
            let createCart = await Cart.create(Object.assign({}, data))
            let createItem = await CartItem.create({
                cartId: createCart.id,
                productId: productId,
                quantity: qty,
                createdAt: new Date()
            })
            let result = {}
            result["cart"] = createCart
            result["cartItem"] = createItem
            let VendorSocketUrl = await CustomerSubscriptionURL(3)
            let adminToVendor = {}
            adminToVendor.cartQuantity = createItem.quantity
            adminToVendor.type = "ADD_CART"
            let VendorSocketResponse = {
                url: VendorSocketUrl,
                response: adminToVendor
            }
            await EmitToSocketPost(VendorSocketResponse)
            return res.status(201).json({ msg: result });
        }
        if (cartId) {
            let cart = await Cart.findOne({
                where: {
                    id: cartId,
                    storeId: storeId,
                    isActive: 1
                }
            })
            if(!cart){
                return res.status(403).json({ msg: "Please remove current cart, and add new cart." });
            }
            const cartDetails = cart && cart.toJSON()//need to check negative cases
            let cartItemDetails = await CartItem.findOne({
                where: {
                    cartId: cartId,
                    productId: productId,
                }
            })
            if (cartItemDetails) {
                if (qty === 0) {
                    await cartItemDetails.destroy();
                    const remainingCount = await CartItem.count({ where: { cartId } });
                    if (remainingCount === 0) {
                        await cart.update({ isActive: 0 });
                    }
                } else {
                    await cartItemDetails.update({ quantity: qty });
                    let VendorSocketUrl = await CustomerSubscriptionURL(3)
                    let adminToVendor = { cartQuantity: qty, type: "ADD_CART" }
                    await EmitToSocketPost({ url: VendorSocketUrl, response: adminToVendor })
                }
                let result = { cart: cartDetails, cartItem: cartItemDetails }
                return res.status(201).json({ msg: result });
            } else {
                let createItem = await CartItem.create({
                    cartId: data.cartId,
                    productId: productId,
                    quantity: qty,
                })
                let result = {}
                result["cart"] = cartDetails
                result["cartItem"] = createItem
                let VendorSocketUrl = await CustomerSubscriptionURL(3)
                let adminToVendor = {}
                adminToVendor.cartQuantity = createItem.quantity
                adminToVendor.type = "ADD_CART"
                let VendorSocketResponse = {
                    url: VendorSocketUrl,
                    response: adminToVendor
                }
                await EmitToSocketPost(VendorSocketResponse)
                return res.status(201).json({ msg: result });
            }
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteCart = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const cart = await Cart.findOne({
            where: { id: data.id }
        });
        if (!cart) return res.status(403).json({ msg: "Cart not found" });
        await CartItem.destroy({ where: { cartId: data.id } });
        await cart.update({ isActive: 0 });
        res.status(200).json({ msg: { cart, cleared: true } });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}