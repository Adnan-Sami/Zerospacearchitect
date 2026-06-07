import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { phone, password, fullName } = await request.json();

    if (!phone || !password || !fullName) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ error: "সঠিক ফোন নম্বর দিন" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }, { status: 400 });
    }

    const email = `${digits}@phone.zerospace.app`;

    // Create user via admin API — no email sent, auto-confirmed
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm, no email sent
      user_metadata: { full_name: fullName.trim(), phone: digits },
    });

    if (createError) {
      if (createError.message.includes("already")) {
        return NextResponse.json({ error: "এই ফোন নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে।" }, { status: 409 });
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Create profile
    if (user?.user) {
      await supabaseAdmin.from("profiles").upsert({
        user_id: user.user.id,
        full_name: fullName.trim(),
        phone: digits,
      }, { onConflict: "user_id" });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "কিছু সমস্যা হয়েছে" }, { status: 500 });
  }
}
