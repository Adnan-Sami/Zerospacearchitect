import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json({ error: "couponId required" }, { status: 400 });
    }

    // Get current count
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("used_count")
      .eq("id", couponId)
      .single();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Increment used_count
    const { error } = await supabaseAdmin
      .from("coupons")
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq("id", couponId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
