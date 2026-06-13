import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function notifyAdmins(title: string, message: string) {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (!admins?.length) return;
  await supabaseAdmin.from("notifications").insert(
    admins.map((a: any) => ({
      user_id: a.user_id,
      title,
      message,
      type: "support",
      link: "/admin/support",
    }))
  );
}

async function notifyUser(userId: string, userRole: string, title: string, message: string) {
  const link = userRole === "instructor" ? "/instructor/support" : "/dashboard/support";
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: "support",
    link,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = body;
    const adminUser = await isAdmin(user.id);

    // ── create-ticket ──────────────────────────────────────────
    if (action === "create-ticket") {
      const { subject, category, message, userRole } = body;
      if (!subject?.trim()) return NextResponse.json({ error: "বিষয় লিখুন" }, { status: 400 });
      if (!message?.trim()) return NextResponse.json({ error: "বার্তা লিখুন" }, { status: 400 });

      const { data: ticket, error: te } = await supabaseAdmin
        .from("support_tickets")
        .insert({
          user_id: user.id,
          user_role: userRole || "student",
          subject: subject.trim(),
          category: category || "general",
          status: "open",
        })
        .select("id")
        .single();
      if (te || !ticket) return NextResponse.json({ error: te?.message || "Failed" }, { status: 400 });

      await supabaseAdmin.from("support_replies").insert({
        ticket_id: ticket.id,
        user_id: user.id,
        sender_role: "user",
        message: message.trim(),
      });

      // Get user's name for notification
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = profile?.full_name || "ব্যবহারকারী";

      await notifyAdmins(
        "নতুন সাপোর্ট টিকেট",
        `${name} একটি নতুন সাপোর্ট টিকেট তৈরি করেছেন: "${subject.trim()}"`
      );

      return NextResponse.json({ success: true, id: ticket.id });
    }

    // ── add-reply ──────────────────────────────────────────────
    if (action === "add-reply") {
      const { ticketId, message, imageUrl } = body;
      if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });
      if (!message?.trim() && !imageUrl) return NextResponse.json({ error: "বার্তা লিখুন" }, { status: 400 });

      // Fetch ticket
      const { data: ticket } = await supabaseAdmin
        .from("support_tickets")
        .select("id, user_id, user_role, subject, status")
        .eq("id", ticketId)
        .maybeSingle();
      if (!ticket) return NextResponse.json({ error: "টিকেট পাওয়া যায়নি" }, { status: 404 });

      // Permission: admin OR ticket owner
      if (!adminUser && ticket.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Cannot reply to closed ticket
      if (ticket.status === "closed") {
        return NextResponse.json({ error: "এই টিকেট বন্ধ হয়েছে" }, { status: 400 });
      }

      const senderRole = adminUser ? "admin" : "user";

      await supabaseAdmin.from("support_replies").insert({
        ticket_id: ticketId,
        user_id: user.id,
        sender_role: senderRole,
        message: message.trim() || "",
        image_url: imageUrl || "",
      });

      // If admin replied and status is 'open', auto-set to 'in_progress'
      if (adminUser && ticket.status === "open") {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("id", ticketId);
      }

      // Notifications
      if (adminUser) {
        // Admin replied → notify ticket owner
        await notifyUser(
          ticket.user_id,
          ticket.user_role,
          "সাপোর্ট টিকেটে রিপ্লাই এসেছে",
          `আপনার টিকেট "${ticket.subject}" এ অ্যাডমিন রিপ্লাই দিয়েছেন।`
        );
      } else {
        // User replied → notify admins
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        const name = profile?.full_name || "ব্যবহারকারী";
        await notifyAdmins(
          "সাপোর্ট টিকেটে নতুন রিপ্লাই",
          `${name} টিকেট "${ticket.subject}" এ রিপ্লাই দিয়েছেন।`
        );
      }

      return NextResponse.json({ success: true });
    }

    // ── update-status ──────────────────────────────────────────
    if (action === "update-status") {
      if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { ticketId, status } = body;
      const validStatuses = ["open", "in_progress", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const { data: ticket } = await supabaseAdmin
        .from("support_tickets")
        .select("id, user_id, user_role, subject")
        .eq("id", ticketId)
        .maybeSingle();
      if (!ticket) return NextResponse.json({ error: "টিকেট পাওয়া যায়নি" }, { status: 404 });

      await supabaseAdmin
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      const statusLabels: Record<string, string> = {
        open: "খোলা",
        in_progress: "প্রক্রিয়াধীন",
        resolved: "সমাধান হয়েছে",
        closed: "বন্ধ",
      };

      await notifyUser(
        ticket.user_id,
        ticket.user_role,
        `টিকেট স্ট্যাটাস আপডেট: ${statusLabels[status] || status}`,
        `আপনার টিকেট "${ticket.subject}" এর স্ট্যাটাস "${statusLabels[status]}" করা হয়েছে।`
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[support]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
