import { StreamChat } from "stream-chat";
import type { Env } from "./env.js";
import type { UserRole } from "../db/schema.js";

// 1. دالة لتنسيق اسم العرض بناءً على دور المستخدم (Admin / Support / User)
export function streamChatDisplayName(
  role: UserRole,
  displayName: string | null,
  email: string,
): string {
  const base = displayName ?? email.split("@")[0];
  if (role === "admin") return `Admin · ${base}`;
  if (role === "support") return `Support · ${base}`;
  return base;
}

// 2. دالة لإنشاء كائن اتصال بسيرفر Stream Chat باستخدام الـ API Key و Secret
export function getStreamChatServer(env: Env) {
  return StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET);
}

// 3. دالة لتوليد ID فريد لمستخدم Stream مسبوقاً بـ clerk_ لتميزه
export function streamUserId(clerkUserId: string) {
  return `clerk_${clerkUserId}`;
}