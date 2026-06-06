import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { REGISTRY_BY_KEY } from "@/content/registry";

// In-memory cache shared across components
let cache: Record<string, string> | null = null;
let loadingPromise: Promise<Record<string, string>> | null = null;
const listeners = new Set<() => void>();

async function loadAll(): Promise<Record<string, string>> {
  if (cache) return cache;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const { data } = await supabase.from("site_content").select("key,value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: any) => { map[row.key] = row.value ?? ""; });
    cache = map;
    loadingPromise = null;
    listeners.forEach((l) => l());
    return map;
  })();
  return loadingPromise;
}

export function invalidateSiteContent() {
  cache = null;
  loadingPromise = null;
  listeners.forEach((l) => l());
}

function resolve(key: string, fallback?: string): string {
  const fromDb = cache?.[key];
  if (fromDb && fromDb.length > 0) return fromDb;
  if (fallback !== undefined) return fallback;
  return REGISTRY_BY_KEY[key]?.defaultValue ?? "";
}

/**
 * Returns the admin-edited value for a key, falling back to the registry default.
 */
export function useSiteContent(key: string, fallback?: string): string {
  const [val, setVal] = useState<string>(() => resolve(key, fallback));
  useEffect(() => {
    let active = true;
    const update = () => { if (active) setVal(resolve(key, fallback)); };
    listeners.add(update);
    loadAll().then(update);
    return () => { active = false; listeners.delete(update); };
  }, [key, fallback]);
  return val;
}
