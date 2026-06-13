import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function hasRole(userId: string, role: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  return !!data;
}

async function notifyAdmins(
  title: string,
  message: string,
  link = "/admin/coupons",
) {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!admins?.length) return;

  await supabaseAdmin.from("notifications").insert(
    admins.map((admin: any) => ({
      user_id: admin.user_id,
      title,
      message,
      type: "coupon",
      link,
    })),
  );
}

async function notifyUser(
  userId: string | null | undefined,
  title: string,
  message: string,
  link = "/instructor/coupons",
) {
  if (!userId) return;

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: "coupon",
    link,
  });
}

async function syncCouponLinks(
  couponId: string,
  courseIds: string[],
  bookIds: string[],
) {
  await supabaseAdmin
    .from("coupon_allowed_courses")
    .delete()
    .eq("coupon_id", couponId);
  await supabaseAdmin
    .from("coupon_allowed_books")
    .delete()
    .eq("coupon_id", couponId);

  if (courseIds.length > 0) {
    await supabaseAdmin
      .from("coupon_allowed_courses")
      .insert(
        courseIds.map((courseId) => ({
          coupon_id: couponId,
          course_id: courseId,
        })),
      );
  }

  if (bookIds.length > 0) {
    await supabaseAdmin
      .from("coupon_allowed_books")
      .insert(
        bookIds.map((bookId) => ({ coupon_id: couponId, book_id: bookId })),
      );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const isAdmin = await hasRole(user.id, "admin");
    const isInstructor = await hasRole(user.id, "instructor");

    if (action === "save") {
      const { coupon, courseIds = [], bookIds = [] } = body;

      if (!coupon?.code?.trim()) {
        return NextResponse.json({ error: "কুপন কোড দিন" }, { status: 400 });
      }
      if (!coupon?.discount_value || Number(coupon.discount_value) <= 0) {
        return NextResponse.json(
          { error: "ডিসকাউন্ট মান দিন" },
          { status: 400 },
        );
      }
      if (!coupon.applies_to_courses && !coupon.applies_to_books) {
        return NextResponse.json(
          { error: "কোর্স বা বই নির্বাচন করুন" },
          { status: 400 },
        );
      }

      const scope = coupon.scope === "instructor" ? "instructor" : "global";
      let instructorId: string | null =
        scope === "instructor" ? (coupon.instructor_id ?? null) : null;

      if (scope === "instructor") {
        if (isInstructor && !isAdmin) {
          instructorId = user.id;
        } else if (isAdmin) {
          if (!instructorId) {
            return NextResponse.json(
              { error: "ইন্সট্রাক্টর নির্বাচন করুন" },
              { status: 400 },
            );
          }
        } else {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (scope === "instructor" && instructorId) {
        if (
          coupon.applies_to_courses &&
          !coupon.all_courses &&
          courseIds.length === 0
        ) {
          return NextResponse.json(
            { error: "কমপক্ষে একটি কোর্স নির্বাচন করুন" },
            { status: 400 },
          );
        }

        const { data: ownedCourses } = await supabaseAdmin
          .from("instructor_courses")
          .select("course_id")
          .eq("instructor_id", instructorId)
          .eq("status", "approved");

        const ownedCourseIds = new Set(
          (ownedCourses ?? []).map((c: any) => c.course_id),
        );
        for (const courseId of courseIds) {
          if (!ownedCourseIds.has(courseId)) {
            return NextResponse.json(
              { error: "নির্বাচিত কোর্স ইন্সট্রাক্টরের নয়" },
              { status: 400 },
            );
          }
        }
      }

      if (
        coupon.applies_to_courses &&
        !coupon.all_courses &&
        scope === "global" &&
        courseIds.length === 0
      ) {
        return NextResponse.json(
          { error: "কমপক্ষে একটি কোর্স নির্বাচন করুন" },
          { status: 400 },
        );
      }

      if (
        coupon.applies_to_books &&
        !coupon.all_books &&
        bookIds.length === 0
      ) {
        return NextResponse.json(
          { error: "কমপক্ষে একটি বই নির্বাচন করুন" },
          { status: 400 },
        );
      }

      const payload = {
        code: coupon.code.trim().toUpperCase(),
        discount_type: coupon.discount_type || "fixed",
        discount_value: Number(coupon.discount_value),
        max_uses: coupon.max_uses ? Number(coupon.max_uses) : null,
        per_user_limit: coupon.per_user_limit
          ? Number(coupon.per_user_limit)
          : null,
        expires_at: coupon.expires_at || null,
        is_active: coupon.is_active ?? true,
        scope,
        instructor_id: instructorId,
        applies_to_courses: !!coupon.applies_to_courses,
        applies_to_books: !!coupon.applies_to_books,
        all_courses: coupon.applies_to_courses ? !!coupon.all_courses : false,
        all_books: coupon.applies_to_books ? !!coupon.all_books : false,
        created_by: user.id,
        approval_status: isAdmin ? "approved" : "pending",
        rejection_reason: isAdmin ? null : (coupon.rejection_reason ?? null),
      };

      let couponId = coupon.id as string | undefined;

      if (couponId) {
        const { data: existing } = await supabaseAdmin
          .from("coupons")
          .select("id, instructor_id, scope, approval_status")
          .eq("id", couponId)
          .maybeSingle();

        if (!existing) {
          return NextResponse.json(
            { error: "কুপন পাওয়া যায়নি" },
            { status: 404 },
          );
        }

        if (!isAdmin) {
          if (
            existing.instructor_id !== user.id ||
            existing.scope !== "instructor"
          ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
          if (existing.approval_status === "approved") {
            return NextResponse.json(
              { error: "অনুমোদিত কুপন এডিট করা যাবে না" },
              { status: 400 },
            );
          }
        }

        const { error } = await supabaseAdmin
          .from("coupons")
          .update({
            ...payload,
            approval_status: isAdmin
              ? coupon.approval_status || "approved"
              : "pending",
          })
          .eq("id", couponId);

        if (error)
          return NextResponse.json({ error: error.message }, { status: 400 });
      } else {
        const { data: created, error } = await supabaseAdmin
          .from("coupons")
          .insert({ ...payload, used_count: 0 })
          .select("id")
          .single();

        if (error)
          return NextResponse.json({ error: error.message }, { status: 400 });
        couponId = created.id;
      }

      await syncCouponLinks(
        couponId!,
        coupon.applies_to_courses && !coupon.all_courses ? courseIds : [],
        coupon.applies_to_books && !coupon.all_books ? bookIds : [],
      );

      if (!isAdmin && scope === "instructor") {
        await notifyAdmins(
          "নতুন কুপন অনুমোদন অপেক্ষমান",
          `ইন্সট্রাক্টর ${payload.code} কুপনটি অনুমোদনের জন্য জমা দিয়েছেন।`,
          "/admin/coupons",
        );
      }

      return NextResponse.json({ success: true, id: couponId });
    }

    if (action === "approve" || action === "reject") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { couponId, rejectionReason } = body;
      if (!couponId) {
        return NextResponse.json(
          { error: "couponId required" },
          { status: 400 },
        );
      }

      const { data: existingCoupon } = await supabaseAdmin
        .from("coupons")
        .select("id, code, instructor_id, scope")
        .eq("id", couponId)
        .maybeSingle();

      if (!existingCoupon) {
        return NextResponse.json(
          { error: "কুপন পাওয়া যায়নি" },
          { status: 404 },
        );
      }

      const { error } = await supabaseAdmin
        .from("coupons")
        .update({
          approval_status: action === "approve" ? "approved" : "rejected",
          rejection_reason:
            action === "reject"
              ? rejectionReason || "অ্যাডমিন প্রত্যাখ্যান করেছেন"
              : null,
          is_active: action === "approve" ? true : false,
        })
        .eq("id", couponId);

      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });

      if (existingCoupon.scope === "instructor") {
        if (action === "approve") {
          await notifyUser(
            existingCoupon.instructor_id,
            "কুপন অনুমোদিত হয়েছে 🎉",
            `${existingCoupon.code} কুপনটি অ্যাডমিন অনুমোদন করেছেন। এখন এটি ব্যবহারযোগ্য।`,
            "/instructor/coupons",
          );
        } else {
          await notifyUser(
            existingCoupon.instructor_id,
            "কুপন প্রত্যাখ্যাত হয়েছে",
            `${existingCoupon.code} কুপনটি প্রত্যাখ্যান করা হয়েছে। কারণ: ${rejectionReason || "অ্যাডমিন প্রত্যাখ্যান করেছেন"}`,
            "/instructor/coupons",
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      const { couponId } = body;
      if (!couponId) {
        return NextResponse.json(
          { error: "couponId required" },
          { status: 400 },
        );
      }

      const { data: existing } = await supabaseAdmin
        .from("coupons")
        .select("id, instructor_id, scope, approval_status")
        .eq("id", couponId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json(
          { error: "কুপন পাওয়া যায়নি" },
          { status: 404 },
        );
      }

      if (!isAdmin) {
        if (
          existing.instructor_id !== user.id ||
          existing.approval_status === "approved"
        ) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      await supabaseAdmin.from("coupons").delete().eq("id", couponId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
