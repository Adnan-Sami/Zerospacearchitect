import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { instructorId } = await request.json();
    if (!instructorId) return NextResponse.json({ months: [], totalEarned: 0, totalPaid: 0 });

    // Get instructor's approved courses
    const { data: instructorCourses } = await supabaseAdmin
      .from("instructor_courses")
      .select("course_id")
      .eq("instructor_id", instructorId)
      .eq("status", "approved");

    const courseIds = (instructorCourses ?? []).map((c: any) => c.course_id).filter(Boolean);

    // Get approved orders for these courses
    let ordersByMonth: Record<string, number> = {};
    if (courseIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("amount, created_at")
        .eq("status", "approved")
        .in("course_id", courseIds);

      (orders ?? []).forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        ordersByMonth[key] = (ordersByMonth[key] || 0) + Math.round(Number(o.amount) * 0.4);
      });
    }

    // Get payments made to this instructor
    const { data: payments } = await supabaseAdmin
      .from("instructor_payments")
      .select("amount, month, paid_at, note")
      .eq("instructor_id", instructorId)
      .order("paid_at", { ascending: false });

    const paymentsByMonth: Record<string, number> = {};
    (payments ?? []).forEach((p: any) => {
      paymentsByMonth[p.month] = (paymentsByMonth[p.month] || 0) + Number(p.amount);
    });

    // Build monthly data
    const allMonths = [...new Set([...Object.keys(ordersByMonth), ...Object.keys(paymentsByMonth)])].sort().reverse();
    const months = allMonths.map((month) => ({
      month,
      earned: ordersByMonth[month] || 0,
      paid: paymentsByMonth[month] || 0,
      due: (ordersByMonth[month] || 0) - (paymentsByMonth[month] || 0),
    }));

    const totalEarned = Object.values(ordersByMonth).reduce((s, v) => s + v, 0);
    const totalPaid = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);

    return NextResponse.json({ months, totalEarned, totalPaid, balance: totalEarned - totalPaid, payments: payments ?? [] });
  } catch (err: any) {
    return NextResponse.json({ months: [], totalEarned: 0, totalPaid: 0, error: err.message }, { status: 500 });
  }
}
