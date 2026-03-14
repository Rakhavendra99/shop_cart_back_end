import express from "express";
import {
    getVendorCookingRate,
    upsertVendorCookingRate,
    getAllCookingRates
} from "../controllers/CookingRates.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/vendor/cooking-rate", verifyUser, getVendorCookingRate);
router.post("/vendor/cooking-rate", verifyUser, upsertVendorCookingRate);
router.get("/cooking-rates", verifyUser, adminOnly, getAllCookingRates);

export default router;

