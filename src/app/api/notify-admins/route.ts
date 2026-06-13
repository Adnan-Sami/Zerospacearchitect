import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const {
      title,
      message,
      type,
      link,
      userId,
      userTitle,
      userMessage,
      userLink,
    } = await request.json();

    // Notify all admins only when an admin-facing notification is provided.
    // Some callers use this route only to notify a specific user/instructor.
    if (title?.trim() && message?.trim()) {
      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins?.length) {
        await supabaseAdmin.from("notifications").insert(
          admins.map((a: any) => ({
            user_id: a.user_id,
            title,
            message,
            type: type || "info",
            link: link || "/admin/orders",
          })),
        );
      }
    }

    // Notify the user if provided
    if (userId && userTitle) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: userTitle,
        message: userMessage || "",
        type: type || "info",
        link: userLink || "/dashboard",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
