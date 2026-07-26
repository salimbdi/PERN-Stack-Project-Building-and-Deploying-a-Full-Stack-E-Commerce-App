// backend/src/lib/users.ts
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const getLocalUser = async (clerkId: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkId));

  return user || null;
};