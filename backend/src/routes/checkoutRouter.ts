import { Router } from "express";
import { handleStripeCheckoutSession } from "../controllers/checkoutController.js";

const checkoutRouter = Router();

checkoutRouter.post("/createcheckout", handleStripeCheckoutSession);
export default checkoutRouter;