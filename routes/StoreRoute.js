import express from "express";
import { verifyUser } from "../middleware/AuthUser.js";
import { createStore, deleteStore, getStoreById, getStores, updateStore } from "../controllers/Stores.js";

const router = express.Router();

router.get('/stores',verifyUser, getStores);
router.get('/stores/:id',verifyUser, getStoreById);
router.post('/stores',verifyUser, createStore);
router.patch('/stores/:id',verifyUser, updateStore);
router.delete('/stores/:id',verifyUser, deleteStore);

export default router;