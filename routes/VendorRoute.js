import express from "express";
import {
    getVendorTypes,
    createVendorType,
    updateVendorType,
    deleteVendorType,
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
    getCookingVendorsForCustomer,
} from "../controllers/Vendors.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/vendor-types", verifyUser, adminOnly, getVendorTypes);
router.post("/vendor-types", verifyUser, adminOnly, createVendorType);
router.patch("/vendor-types/:id", verifyUser, adminOnly, updateVendorType);
router.delete("/vendor-types/:id", verifyUser, adminOnly, deleteVendorType);

router.get("/vendors", verifyUser, adminOnly, getVendors);
router.get("/vendors/:id", verifyUser, adminOnly, getVendorById);
router.post("/vendors", verifyUser, adminOnly, createVendor);
router.patch("/vendors/:id", verifyUser, adminOnly, updateVendor);
router.delete("/vendors/:id", verifyUser, adminOnly, deleteVendor);

// Customer-facing endpoint to list active cooking vendors with rate
router.get("/customer/cooking-vendors", getCookingVendorsForCustomer);

export default router;

