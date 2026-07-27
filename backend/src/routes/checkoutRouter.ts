import { Router } from "express";
import { createCheckout } from "../controllers/checkoutController.js";

const checkoutRouter = Router();

checkoutRouter.post("/createcheckout", createCheckout);
export default checkoutRouter;