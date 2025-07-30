import { Router } from "express";
import productController from "../controllers/product";
import * as configController from "../controllers/configController";

const router = Router();

router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProductById);

router.get("/slots", (req, res) => {
  res.json({ slots: ["9am", "10am", "11am"] });
});

router.post("/configurations", configController.saveConfig);
router.get("/configurations/:id", configController.getConfig);

export default router;
