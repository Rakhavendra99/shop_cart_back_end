import express from "express";
import { createOrder } from "../controllers/Orders.js";

const router = express.Router();


router.post('/customer/order', createOrder);

export default router;