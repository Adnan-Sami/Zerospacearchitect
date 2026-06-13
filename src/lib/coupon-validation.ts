import type { SupabaseClient } from "@supabase/supabase-js";

export type CouponRecord = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  per_user_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  scope?: string;
  instructor_id?: string | null;
  approval_status?: string;
  applies_to_courses?: boolean;
  applies_to_books?: boolean;
  all_courses?: boolean;
  all_books?: boolean;
};

export type CouponContext =
  | { type: "course"; itemId: string; userId?: string }
  | { type: "book"; itemId: string; userId?: string };

/**
 * Validates a coupon code against the given context (course or book purchase).
 *
 * All validation runs server-side via /api/validate-coupon so that:
 *  - The admin Supabase client is used, bypassing RLS on instructor_courses
 *    and other restricted tables.
 *  - Instructor-scoped coupon checks work correctly for every user type.
 *
 * The `supabase` param is kept for backward-compatibility; it is only used to
 * attach the current user's auth token to the request (for per-user-limit checks).
 */
export async function validateCoupon(
  supabase: SupabaseClient,
  code: string,
  context: CouponContext,
): Promise<{ ok: true; coupon: CouponRecord } | { ok: false; error: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/validate-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({
        code,
        type: context.type,
        itemId: context.itemId,
      }),
    });

    const data = await res.json();
    return data as
      | { ok: true; coupon: CouponRecord }
      | { ok: false; error: string };
  } catch {
    return { ok: false, error: "কুপন যাচাই করতে সমস্যা হয়েছে।" };
  }
}
