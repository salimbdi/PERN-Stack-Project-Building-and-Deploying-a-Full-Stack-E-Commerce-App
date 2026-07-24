import express, { Request, Response } from 'express';
import { clerkMiddleware } from '@clerk/express'
import dotenv from 'dotenv';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3000;
import { clerkWebhookHandler } from "./webhooks/clerk";
import path from 'path';
import fs from 'fs';

dotenv.config();
app.use(express.json());
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
  
app.use(clerkMiddleware());
app.use(cors());
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

// it's important that you don't parse the webhook event data, it should be in the raw format
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

function cors(): any {
  throw new Error('Function not implemented.');
}

