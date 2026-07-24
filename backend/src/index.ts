import express, { Request, Response } from 'express';
import { clerkMiddleware } from '@clerk/express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { clerkWebhookHandler } from "./webhooks/clerk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares الأساسية
app.use(cors());
app.use(express.json());

// 2. تعريف rawJson لـ Webhooks قبل استخدامها
const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// 3. Webhook الخاص بـ Clerk
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

// 4. Clerk Middleware لباقي الـ Routes
app.use(clerkMiddleware());

// 5. تقديم ملفات الـ Static المبنيه من Frontend (Vite)
const publicDir = path.join(process.cwd(), "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res, next) => {
    // Skip API and Webhook endpoints
    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
      return next();
    }

    // Serve index.html for all React Router routes
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.get('/api/health', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

// 6. تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
// ✅ إضافة "0.0.0.0" لضمان استقبال الاتصالات من خارج الحاوية
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});