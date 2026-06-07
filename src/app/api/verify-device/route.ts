import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { userId, fingerprint, deviceInfo } = await request.json();
    if (!userId || !fingerprint) {
      return NextResponse.json({ allowed: false, reason: "missing_data" });
    }

    // Get client IP
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";

    // Check if IP is banned
    const { data: bannedIp } = await supabaseAdmin
      .from("banned_ips")
      .select("id")
      .eq("ip_address", clientIp)
      .maybeSingle();
    if (bannedIp) {
      return NextResponse.json({ allowed: false, reason: "ip_banned" });
    }

    // Check if user is admin — admins are exempt
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (roles && roles.length > 0) {
      return NextResponse.json({ allowed: true });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("device_fingerprint, device_info, is_banned, last_ip")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ allowed: false, reason: "no_profile" });
    }

    // If already banned
    if (profile.is_banned) {
      return NextResponse.json({ allowed: false, reason: "banned" });
    }

    // Save IP to profile
    await supabaseAdmin
      .from("profiles")
      .update({ last_ip: clientIp })
      .eq("user_id", userId);

    // First login — save device
    if (!profile.device_fingerprint) {
      await supabaseAdmin
        .from("profiles")
        .update({ device_fingerprint: fingerprint, device_info: deviceInfo })
        .eq("user_id", userId);
      return NextResponse.json({ allowed: true, first_device: true });
    }

    // Same device — allowed
    if (profile.device_fingerprint === fingerprint) {
      await supabaseAdmin
        .from("profiles")
        .update({ device_info: deviceInfo })
        .eq("user_id", userId);
      return NextResponse.json({ allowed: true });
    }

    // DIFFERENT DEVICE — auto-ban user + ban the IP
    await supabaseAdmin
      .from("profiles")
      .update({ is_banned: true })
      .eq("user_id", userId);

    // Ban the IP
    await supabaseAdmin
      .from("banned_ips")
      .upsert({ ip_address: clientIp, reason: `Auto-ban: user ${userId} different device`, user_id: userId }, { onConflict: "ip_address" });

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.user_id,
          title: "⚠️ সন্দেহজনক লগইন — অটো ব্যান",
          message: `ভিন্ন ডিভাইস থেকে লগইন চেষ্টা। IP: ${clientIp} · ডিভাইস: ${deviceInfo}। ইউজার ও IP ব্যান করা হয়েছে।`,
          type: "security",
          link: "/admin/students",
        }))
      );
    }

    return NextResponse.json({ allowed: false, reason: "different_device" });
  } catch (err: any) {
    return NextResponse.json({ allowed: false, reason: err.message }, { status: 500 });
  }
}
