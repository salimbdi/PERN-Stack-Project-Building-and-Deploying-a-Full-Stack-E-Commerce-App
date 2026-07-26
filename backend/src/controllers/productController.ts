// backend/src/controllers/productController.ts
import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { products } from "../db/schema";
import { eq } from "drizzle-orm";

// GET /api/products - List all products (Protected Route)
export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAuthenticated } = getAuth(req);
    if (!isAuthenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const allProducts = await db.select().from(products);
    res.json({ products: allProducts });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/categories - List product categories (Protected Route)
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAuthenticated } = getAuth(req);
    if (!isAuthenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Example query: Fetch distinct categories or return static list
    const categories = ["Electronics", "Clothing", "Books"];
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug - Fetch single product by slug (Protected Route)
export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAuthenticated } = getAuth(req);
    if (!isAuthenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { slug } = req.params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug as string));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};