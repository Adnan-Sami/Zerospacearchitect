import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Check if already has instructor role
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "instructor")
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "instructor",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
