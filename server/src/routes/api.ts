import { Router } from "express";
import productController from "../controllers/product";

const router = Router();

router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProductById);

export default router;
