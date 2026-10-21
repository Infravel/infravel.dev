import { getCloudflareContext } from "@opennextjs/cloudflare";
import type {
  D1Database,
  AnalyticsEngineDataset,
} from "@cloudflare/workers-types";
export interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_HOSTNAMES: string;
  BREVO_API_KEY?: string;
  EMAIL_FROM?: string;
  LEAD_NOTIFICATION_TO?: string;
  RETRY_SECRET?: string;
  RATE_LIMIT_SALT: string;
  DEPLOYMENT_ENV?: string;
  CONVERSIONS?: AnalyticsEngineDataset;
}
export async function getEnv(): Promise<Env> {
  return (await getCloudflareContext({ async: true })).env as unknown as Env;
}
