import { supabaseAdmin } from "@/integrations/supabase/client.server";

let cachedRate: number | null = null;

export async function getCommissionRate(): Promise<number> {
  if (cachedRate !== null) return cachedRate;
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("commission_percentage")
    .limit(1)
    .maybeSingle();
  cachedRate = Number(data?.commission_percentage) || 40;
  return cachedRate;
}

export function getCommissionMultiplier(rate: number): number {
  return rate / 100;
}

export function calculateCommission(amount: number, rate: number): number {
  return Math.round(amount * getCommissionMultiplier(rate));
}
