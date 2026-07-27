import express, { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { clerkWebhookHandler } from "./webhooks/clerk";
import { polarWebhookHandler } from "./webhooks/polar";

import keepAliveCron from "./lib/cron";
dotenv.config();

import meRouter from './routes/meRouter';
import productRouter from './routes/productRouter';
import streamRouter from './routes/streamRouter';
import checkoutRouter from './routes/checkoutRouter';
import * as Sentry from "@sentry/node";
import { sentryClerkUserMiddleware } from './middleware/sentryClerkUser';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Webhook endpoint (Raw body parsing required for Clerk webhooks)
const rawJson = express.raw({ type: "application/json", limit: "1mb" });
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.post("/webhooks/polar", rawJson, (req, res) => {
  void polarWebhookHandler(req, res);
});

// 2. Global Middlewares
app.use(cors());
app.use(express.json());

// 3. Clerk Middleware
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

// 4. API Routes & Health Checks
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

app.use('/api/me', meRouter);
app.use('/api/products', productRouter);
app.use('/api/stream', streamRouter); // Fixed typo: 'streram' -> 'stream'
app.use('/api/checkout', checkoutRouter);
// 5. Serve Frontend Static Build (Vite/React SPA)
const publicDir = path.join(process.cwd(), "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Express 5 named wildcard syntax to catch all frontend routes (e.g. /, /about, /products/123)
  app.get("/{*splat}", (req, res, next) => {
    // Skip API, Webhook, and Health endpoints
    if (
      req.path.startsWith("/api") || 
      req.path.startsWith("/webhooks") || 
      req.path.startsWith("/health")
    ) {
      return next();
    }

    // Serve index.html for React Router / SPA fallback
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// 6. Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});
// sentry will be attached to the response object
Sentry.setupExpressErrorHandler(app);

app.use(
  (_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const sentryId = (res as express.Response & { sentry?: string }).sentry;

    res.status(500).json({
      error: "Internal server error",
      ...(sentryId !== undefined && { sentryId }),
    });
  },
);
// 7. Start Server
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    keepAliveCron.start();
  }
});