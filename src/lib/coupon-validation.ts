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

async function checkPerUserLimit(
  supabase: SupabaseClient,
  coupon: CouponRecord,
  userId?: string
): Promise<string | null> {
  if (!coupon.per_user_limit || !userId) return null;

  const { count: courseUses } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("coupon_code", coupon.code);

  const { count: bookUses } = await supabase
    .from("book_orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("coupon_code", coupon.code);

  const totalUserUses = (courseUses ?? 0) + (bookUses ?? 0);
  if (totalUserUses >= coupon.per_user_limit) {
    return "আপনি এই কুপনটি সর্বোচ্চ সীমায় ব্যবহার করেছেন।";
  }
  return null;
}

async function validateCourseScope(
  supabase: SupabaseClient,
  coupon: CouponRecord,
  courseId: string
): Promise<string | null> {
  if (coupon.applies_to_courses === false) {
    return "এই কুপন কোর্সে প্রযোজ্য নয়।";
  }

  if (coupon.scope === "instructor" && coupon.instructor_id) {
    const { data: link } = await supabase
      .from("instructor_courses")
      .select("instructor_id")
      .eq("course_id", courseId)
      .eq("instructor_id", coupon.instructor_id)
      .eq("status", "approved")
      .maybeSingle();

    if (!link) {
      return "এই কুপন এই কোর্সে প্রযোজ্য নয়।";
    }
  }

  if (coupon.all_courses !== false) {
    return null;
  }

  const { data: allowed } = await supabase
    .from("coupon_allowed_courses")
    .select("course_id")
    .eq("coupon_id", coupon.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!allowed) {
    return coupon.scope === "instructor"
      ? "এই কুপন শুধু ইন্সট্রাক্টরের নির্বাচিত কোর্সে প্রযোজ্য।"
      : "এই কুপন নির্বাচিত কোর্সে প্রযোজ্য নয়।";
  }

  return null;
}

async function validateBookScope(
  supabase: SupabaseClient,
  coupon: CouponRecord,
  bookId: string
): Promise<string | null> {
  if (coupon.applies_to_books === false) {
    return "এই কুপন বইতে প্রযোজ্য নয়।";
  }

  if (coupon.all_books !== false) {
    return null;
  }

  const { data: allowed } = await supabase
    .from("coupon_allowed_books")
    .select("book_id")
    .eq("coupon_id", coupon.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (!allowed) {
    return "এই কুপন নির্বাচিত বইতে প্রযোজ্য নয়।";
  }

  return null;
}

export async function validateCoupon(
  supabase: SupabaseClient,
  code: string,
  context: CouponContext
): Promise<{ ok: true; coupon: CouponRecord } | { ok: false; error: string }> {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { ok: false, error: "এই কুপন কোড বৈধ নয়।" };
  }

  if (coupon.approval_status && coupon.approval_status !== "approved") {
    return { ok: false, error: "এই কুপন এখনো অনুমোদিত হয়নি।" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false, error: "কুপনের মেয়াদ শেষ।" };
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { ok: false, error: "কুপনের সীমা শেষ।" };
  }

  const perUserError = await checkPerUserLimit(supabase, coupon, context.userId);
  if (perUserError) {
    return { ok: false, error: perUserError };
  }

  if (context.type === "course") {
    const scopeError = await validateCourseScope(supabase, coupon, context.itemId);
    if (scopeError) return { ok: false, error: scopeError };
  } else {
    const scopeError = await validateBookScope(supabase, coupon, context.itemId);
    if (scopeError) return { ok: false, error: scopeError };
  }

  return { ok: true, coupon };
}
