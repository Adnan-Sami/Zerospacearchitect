import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCommissionRate, calculateCommission } from "@/lib/commission";

export async function POST(request: Request) {
  try {
    const { instructorId } = await request.json();
    if (!instructorId) return NextResponse.json({ courses: [], total: 0 });

    const commissionRate = await getCommissionRate();

    // Get instructor's approved courses
    const { data: instructorCourses } = await supabaseAdmin
      .from("instructor_courses")
      .select("course_id, course_title")
      .eq("instructor_id", instructorId)
      .eq("status", "approved");

    const list = instructorCourses ?? [];
    const courseIds = list.map((c: any) => c.course_id).filter(Boolean);

    if (courseIds.length === 0) return NextResponse.json({ courses: [], total: 0 });

    // Get approved orders for these courses
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("course_id, amount")
      .eq("status", "approved")
      .in("course_id", courseIds);

    const orderMap: Record<string, { sales: number; revenue: number }> = {};
    (orders ?? []).forEach((o: any) => {
      if (!orderMap[o.course_id]) orderMap[o.course_id] = { sales: 0, revenue: 0 };
      orderMap[o.course_id].sales++;
      orderMap[o.course_id].revenue += Number(o.amount);
    });

    const courses = list.map((c: any) => {
      const stats = orderMap[c.course_id] || { sales: 0, revenue: 0 };
      return { course_id: c.course_id, course_title: c.course_title, sales: stats.sales, revenue: stats.revenue, commission: calculateCommission(stats.revenue, commissionRate) };
    });

    const total = courses.reduce((s: number, c: any) => s + c.commission, 0);

    return NextResponse.json({ courses, total });
  } catch (err: any) {
    return NextResponse.json({ courses: [], total: 0, error: err.message }, { status: 500 });
  }
}
