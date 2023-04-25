import express from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductCategory,
    getCustomerProducts,
    getCustomerProductById
} from "../controllers/Products.js";
import { verifyUser } from "../middleware/AuthUser.js";
import { createStore, getStores } from "../controllers/Stores.js";

const router = express.Router();

router.get('/stores',verifyUser, getStores);
router.get('/stores/category',verifyUser, getProductCategory);
router.get('/stores/:id',verifyUser, getProductById);
router.post('/stores',verifyUser, createStore);
router.patch('/stores/:id',verifyUser, updateProduct);
router.delete('/stores/:id',verifyUser, deleteProduct);


router.get('/customer/products',getCustomerProducts);
router.get('/customer/products/:id',verifyUser, getCustomerProductById);

export default router;