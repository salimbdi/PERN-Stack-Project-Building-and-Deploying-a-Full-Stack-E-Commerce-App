import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { getLocalUser } from "../lib/users.js";
import { getStreamChatServer, streamChatDisplayName, streamUserId } from "../lib/stream.js";
import { getEnv } from "../lib/env.js";

const env = getEnv();

export async function createStreamToken(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. التحقق من جلسة وتسجيل دخول المستخدم عبر Clerk
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // 2. التأكد من وجود بيانات المستخدم في قاعدة البيانات المحلية (Neon PostgreSQL)
    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    // 3. تهيئة سيرفر Stream
    const server = getStreamChatServer(env);

    // 4. جلب معلومات حساب المستخدم الرسمية من سيرفر Clerk (الاسم والصورة)
    const clerkUser = await clerkClient.users.getUser(userId);

    // 5. تجميع الاسم الأول والأخير
    const combined = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    // 6. تحديد شكل الاسم الذي سيظهر في الشات
    const name = streamChatDisplayName(
      localUser.role,
      localUser.displayName ?? combined ?? clerkUser.username,
      localUser.email,
    );

    const image = clerkUser.imageUrl || undefined;
    const sid = streamUserId(userId);

    // 7. تحديث أو إضافة بيانات المستخدم داخل سيرفر Stream Chat
    await server.upsertUser({ id: sid, name, image });

    // 8. إنشاء توكن الأمان الجاهز للاستخدام في Frontend
    const token = server.createToken(sid);

    // 9. إرجاع النتيجة للتطبيق
    res.json({ token, apiKey: env.STREAM_API_KEY, userId: sid, name });
  } catch (e) {
    next(e);
  }
}