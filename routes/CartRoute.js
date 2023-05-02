import express from "express";
import { verifyUser } from "../middleware/AuthUser.js";
import { createCart, deleteCart, getCartById } from "../controllers/Cart.js";

const router = express.Router();

router.get('/cart/:id', getCartById);
router.post('/cart', createCart);
router.delete('/cart/:id', deleteCart);

export default router;