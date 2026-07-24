import { z } from "zod";

// Helper: treat empty strings as undefined so that Render env vars set to ""
// don't fail optional validations like .min(1) or .url()
function optionalStr(validator: z.ZodString) {
  return z.preprocess(
    (val) => (val === "" ? undefined : val),
    validator.optional()
  );
}
function optionalUrl() {
  return z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url().optional()
  );
}
function optionalUuid() {
  return z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().uuid().optional()
  );
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),

  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: optionalStr(z.string()),

  FRONTEND_URL: z.string().url(),

  POLAR_ACCESS_TOKEN: optionalStr(z.string()),
  POLAR_WEBHOOK_SECRET: optionalStr(z.string()),
  POLAR_API_BASE: z.string().url().default("https://api.polar.sh"),

  POLAR_CHECKOUT_PRODUCT_ID: optionalUuid(),

  STREAM_API_KEY: optionalStr(z.string().min(1)),
  STREAM_API_SECRET: optionalStr(z.string().min(1)),

  IMAGEKIT_PUBLIC_KEY: optionalStr(z.string().min(1)),
  IMAGEKIT_PRIVATE_KEY: optionalStr(z.string().min(1)),
  IMAGEKIT_URL_ENDPOINT: optionalUrl(),

  SENTRY_DSN: optionalUrl(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

let cachedEnv: Env | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }

  return cachedEnv;
}