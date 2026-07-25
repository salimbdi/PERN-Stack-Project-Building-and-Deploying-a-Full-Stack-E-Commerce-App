import express, { Request, Response , NextFunction} from 'express';
import { clerkMiddleware } from '@clerk/express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { clerkWebhookHandler } from "./webhooks/clerk";

import keepAliveCron from "./lib/cron";
dotenv.config();
import meRouter from './routes/meRouter';
import productRouter from './routes/productRouter';
import streamRouter from './routes/streamRouter';
const app = express();
const PORT = process.env.PORT || 3000;


const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// 3. Webhook
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.use(cors());
app.use(express.json());

// 4. Clerk Middleware لباقي الـ Routes
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});
app.use('/api/me', meRouter);
app.use('/api/products', productRouter);
app.use('/api/streram', streamRouter);
// 5. تقديم ملفات الـ Static المبنيه من Frontend (Vite)
const publicDir = path.join(process.cwd(), "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Catch-all route should be /*, not /{*any} which is specific to some routers,
  // but let's keep /* to make sure it handles all front-end routing
  app.get("/*", (req, res, next) => {
    // Skip API and Webhook endpoints
    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks") || req.path.startsWith("/health")) {
      return next();
    }

    // Serve index.html for all React Router routes
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// 6. تشغيل السيرفر
// ✅ إضافة "0.0.0.0" لضمان استقبال الاتصالات من خارج الحاوية
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    keepAliveCron.start();
  }
});
