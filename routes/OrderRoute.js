import express from "express";
import { createOrder, getOrderById, getOrders, updateOrder } from "../controllers/Orders.js";
import { listCookingVendorOrders, patchCookingWorkflow } from "../controllers/CookingWorkflow.js";
import { verifyUser, cookingVendorOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/cooking-vendor/orders", verifyUser, cookingVendorOnly, listCookingVendorOrders);
router.patch("/cooking-vendor/orders/:id/workflow", verifyUser, cookingVendorOnly, patchCookingWorkflow);

router.get('/order', verifyUser, getOrders);
router.get('/order/:id', verifyUser, getOrderById);
router.patch('/order/:id', verifyUser, updateOrder);

router.post('/customer/order', createOrder);

export default router;