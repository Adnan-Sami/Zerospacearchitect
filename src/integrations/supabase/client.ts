import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Module-level singleton — safe in browser, re-created per request in RSC
let _client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    // Server-side: always create a fresh instance (no singleton leak between requests)
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!_client) {
    _client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

/**
 * Convenience singleton that matches all existing `import { supabase }` usage.
 * Uses a Proxy so the singleton is created lazily after env vars are available.
 */
export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserClient>,
  {
    get(_, prop, receiver) {
      return Reflect.get(getSupabaseBrowserClient(), prop, receiver);
    },
  }
);
