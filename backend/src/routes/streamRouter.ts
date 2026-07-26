import { Router } from "express";
import { createStreamToken } from "../controllers/streamcontroller";

const router = Router();

// تعريف المسار POST لجلب التوكن
router.post("/token", createStreamToken);

export default router;