import { getEnv } from "@/lib/env";
import { submission } from "@/lib/submissions";
import { safeError } from "@/lib/security";
export async function POST(request: Request) {
  try {
    return await submission(request, await getEnv(), "waitlist");
  } catch (e) {
    return safeError(e);
  }
}
