import express from "express";
import { createOrder, getOrderById, getOrders } from "../controllers/Orders.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.get('/order', verifyUser, getOrders);
router.get('/order/:id', verifyUser, getOrderById);

router.post('/customer/order', createOrder);

export default router;