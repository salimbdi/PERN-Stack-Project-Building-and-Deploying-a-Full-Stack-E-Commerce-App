import {Router} from 'express';
import { requireAdmin } from '../controllers/adminController';

import { getImageKitAuth } from "../controllers/adminController.js";
import { listAdminProducts ,createAdminProduct, deleteAdminProduct ,  updateAdminProduct} from "../controllers/adminController.js";
const router = Router();

router.use(requireAdmin);

router.get("/imageKit/auth", getImageKitAuth)

// Route: GET /api/admin/products
router.get("/products", listAdminProducts);

router.post("/products", createAdminProduct)
router.delete("/products/:id", deleteAdminProduct);
router.patch("/products/:id",updateAdminProduct);
export default router
