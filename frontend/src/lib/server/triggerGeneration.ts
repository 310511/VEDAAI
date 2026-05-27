import { qstash } from "./qstash";
import { runGeneration } from "./runGeneration";

function appBaseUrl(): string | null {
  // Production: Use Vercel URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  
  // Local development with tunnel: Use NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    // Don't use localhost URLs with QStash (loopback address not reachable from cloud)
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      console.warn("[VedaAI] NEXT_PUBLIC_APP_URL is localhost, QStash cannot reach loopback addresses");
      return null;
    }
    return url;
  }
  
  return null;
}

async function triggerViaQStash(assignmentId: string): Promise<boolean> {
  const baseUrl = appBaseUrl();
  
  // If we can't get a valid non-loopback URL, skip QStash
  if (!baseUrl) {
    console.warn("[VedaAI] Cannot use QStash: no valid public URL (set NEXT_PUBLIC_APP_URL to a tunnel URL like ngrok)");
    return false;
  }
  
  const url = `${baseUrl}/api/internal/generate/${assignmentId}`;
  const secret = process.env.INTERNAL_API_SECRET;
  
  console.log("[VedaAI] Triggering generation via QStash", assignmentId, "→", url);
  
  await qstash.publishJSON({
    url,
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    body: { assignmentId },
  });
  
  console.log("[VedaAI] Generation scheduled via QStash");
  return true;
}

async function runInBackground(assignmentId: string): Promise<void> {
  const isProduction = !!process.env.VERCEL_URL;
  const hasQStashToken = !!process.env.QSTASH_TOKEN;
  const hasValidPublicUrl = appBaseUrl() !== null;
  
  // Use QStash if: (production OR has tunnel URL) AND has token
  if (hasQStashToken && (isProduction || hasValidPublicUrl)) {
    const success = await triggerViaQStash(assignmentId);
    if (success) return;
  }
  
  // Local development or QStash unavailable: run synchronously
  if (!isProduction) {
    console.log("[VedaAI] Local development: running generation synchronously", assignmentId);
  } else {
    console.warn("[VedaAI] Production fallback: running generation synchronously", assignmentId);
  }
  
  await runGeneration(assignmentId);
}

/** Start paper generation via QStash (production) or direct execution (local dev). */
export async function triggerGeneration(assignmentId: string): Promise<void> {
  await runInBackground(assignmentId);
}
