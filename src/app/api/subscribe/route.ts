import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Save to subscribers table
    await supabaseAdmin.from("subscribers").upsert(
      { email },
      { onConflict: "email" }
    );

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.user_id,
          title: "নতুন সাবস্ক্রাইবার",
          message: `${email} নিউজলেটারে সাবস্ক্রাইব করেছে।`,
          type: "subscriber",
          link: "/admin",
        }))
      );
    }

    // Send email to admin via Resend (if API key exists)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Zero Space Architect <onboarding@resend.dev>",
          to: "mahisamiul@gmail.com",
          subject: `নতুন সাবস্ক্রাইবার: ${email}`,
          html: `<h2>নতুন নিউজলেটার সাবস্ক্রাইবার</h2><p><strong>ইমেইল:</strong> ${email}</p><p><strong>সময়:</strong> ${new Date().toLocaleString("bn-BD")}</p>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
