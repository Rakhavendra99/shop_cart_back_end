import express from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/StripeController.js";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);

export default router;
