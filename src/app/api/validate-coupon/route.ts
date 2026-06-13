import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, type, itemId } = body as {
      code: string;
      type: "course" | "book";
      itemId: string;
    };

    if (!code || !type || !itemId) {
      return NextResponse.json({ ok: false, error: "এই কুপন কোড বৈধ নয়।" });
    }

    // Identify the calling user from the auth header (optional — for per-user limit)
    let userId: string | undefined;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // ── Fetch the coupon using admin client (bypasses all RLS) ─────────────────
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ ok: false, error: "এই কুপন কোড বৈধ নয়।" });
    }

    // Must be approved (instructor-created coupons start as "pending")
    if (coupon.approval_status && coupon.approval_status !== "approved") {
      return NextResponse.json({
        ok: false,
        error: "এই কুপন এখনো অনুমোদিত হয়নি।",
      });
    }

    // Expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: "কুপনের মেয়াদ শেষ।" });
    }

    // Global usage cap
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ ok: false, error: "কুপনের সীমা শেষ।" });
    }

    // ── Per-user limit ────────────────────────────────────────────────────────
    if (coupon.per_user_limit && userId) {
      const [{ count: courseUses }, { count: bookUses }] = await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("coupon_code", coupon.code),
        supabaseAdmin
          .from("book_orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("coupon_code", coupon.code),
      ]);
      const totalUserUses = (courseUses ?? 0) + (bookUses ?? 0);
      if (totalUserUses >= coupon.per_user_limit) {
        return NextResponse.json({
          ok: false,
          error: "আপনি এই কুপনটি সর্বোচ্চ সীমায় ব্যবহার করেছেন।",
        });
      }
    }

    // ── Scope validation ──────────────────────────────────────────────────────
    if (type === "course") {
      if (coupon.applies_to_courses === false) {
        return NextResponse.json({
          ok: false,
          error: "এই কুপন কোর্সে প্রযোজ্য নয়।",
        });
      }

      // Instructor-scoped: verify the course belongs to this instructor
      // Uses admin client so RLS on instructor_courses is bypassed.
      // We intentionally omit the status filter — ownership matters, not
      // the instructor's submission workflow status.
      if (coupon.scope === "instructor" && coupon.instructor_id) {
        const { data: link } = await supabaseAdmin
          .from("instructor_courses")
          .select("instructor_id")
          .eq("course_id", itemId)
          .eq("instructor_id", coupon.instructor_id)
          .maybeSingle();

        if (!link) {
          return NextResponse.json({
            ok: false,
            error: "এই কুপন এই কোর্সে প্রযোজ্য নয়।",
          });
        }
      }

      // Coupon covers all courses (or all of this instructor's courses)?
      if (coupon.all_courses !== false) {
        return NextResponse.json({ ok: true, coupon });
      }

      // Coupon limited to specific courses
      const { data: allowed } = await supabaseAdmin
        .from("coupon_allowed_courses")
        .select("course_id")
        .eq("coupon_id", coupon.id)
        .eq("course_id", itemId)
        .maybeSingle();

      if (!allowed) {
        return NextResponse.json({
          ok: false,
          error:
            coupon.scope === "instructor"
              ? "এই কুপন শুধু ইন্সট্রাক্টরের নির্বাচিত কোর্সে প্রযোজ্য।"
              : "এই কুপন নির্বাচিত কোর্সে প্রযোজ্য নয়।",
        });
      }
    } else if (type === "book") {
      if (coupon.applies_to_books === false) {
        return NextResponse.json({
          ok: false,
          error: "এই কুপন বইতে প্রযোজ্য নয়।",
        });
      }

      if (coupon.all_books !== false) {
        return NextResponse.json({ ok: true, coupon });
      }

      const { data: allowed } = await supabaseAdmin
        .from("coupon_allowed_books")
        .select("book_id")
        .eq("coupon_id", coupon.id)
        .eq("book_id", itemId)
        .maybeSingle();

      if (!allowed) {
        return NextResponse.json({
          ok: false,
          error: "এই কুপন নির্বাচিত বইতে প্রযোজ্য নয়।",
        });
      }
    }

    return NextResponse.json({ ok: true, coupon });
  } catch (err: any) {
    console.error("[validate-coupon]", err);
    return NextResponse.json({
      ok: false,
      error: "কুপন যাচাই করতে সমস্যা হয়েছে।",
    });
  }
}
