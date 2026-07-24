import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { parseRole } from "../lib/roles";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function clerkWebhookHandler(req: Request, res: Response) {
  // Read ONLY what this handler needs directly from process.env.
  // Do NOT call getEnv() here — that validates the full schema and would crash
  // if any unrelated optional var (Stream, ImageKit, Polar, etc.) is missing/blank.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  try {
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      res.status(503).send("Webhook secret is not configured");
      return;
    }

    // Clerk's verifier expects a Web Request with the raw body; Express may give Buffer or string.
    const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    // throws if signature is wrong or body was tampered with; only then we trust evt.
    const evt = await verifyWebhook(request, { signingSecret: webhookSecret });

    console.log("Clerk webhook received:", evt.type);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address;

      const displayName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || null;

      const role = parseRole(u.public_metadata?.role);

      console.log(`Upserting user: clerkId=${u.id} email=${email}`);

      await db
        .insert(users)
        .values({
          clerkUserId: u.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });

      console.log(`User upserted successfully: clerkId=${u.id}`);
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        console.log(`Deleting user: clerkId=${id}`);
        await db.delete(users).where(eq(users.clerkUserId, id));
        console.log(`User deleted: clerkId=${id}`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    // Bad signature, malformed payload, or DB error — do not leak details to the client.
    console.error("Clerk webhook error:", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}