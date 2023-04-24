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

const router = express.Router();

router.get('/products',verifyUser, getProducts);
router.get('/products/category',verifyUser, getProductCategory);
router.get('/products/:id',verifyUser, getProductById);
router.post('/products',verifyUser, createProduct);
router.patch('/products/:id',verifyUser, updateProduct);
router.delete('/products/:id',verifyUser, deleteProduct);


router.get('/customer/products',getCustomerProducts);
router.get('/customer/products/:id',verifyUser, getCustomerProductById);

export default router;