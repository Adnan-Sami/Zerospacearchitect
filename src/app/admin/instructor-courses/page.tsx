"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminInstructorCourses() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [tab, setTab] = useState<"applications" | "courses">("applications");
  const [pendingApps, setPendingApps] = useState(0);
  const [pendingCourses, setPendingCourses] = useState(0);

  const load = async () => {
    // Load course submissions
    let query = supabase.from("instructor_courses").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r: any) => r.instructor_id))];
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p]));
    }
    setSubmissions(rows.map((r: any) => ({ ...r, profile: profileMap[r.instructor_id] })));

    // Load applications from service_requests
    const { data: apps } = await supabase
      .from("service_requests")
      .select("*")
      .eq("service_type", "instructor_application")
      .order("created_at", { ascending: false });
    setApplications(apps ?? []);
    
    // Count pending items
    setPendingApps((apps ?? []).filter((a: any) => a.status === "new").length);
    const { count: pendingCoursesCount } = await supabase
      .from("instructor_courses")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCourses(pendingCoursesCount ?? 0);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string, instructorId: string, title: string) => {
    await supabase.from("instructor_courses").update({ status }).eq("id", id);

    if (status === "approved") {
      // Just notify — admin will create the full course manually from admin courses panel
      await fetch("/api/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: instructorId,
          userTitle: "কোর্স অ্যাপ্রুভড! 🎉",
          userMessage: `"${title}" কোর্স অ্যাপ্রুভ করা হয়েছে। শীঘ্রই লাইভ হবে।`,
          userLink: "/instructor",
          title: "", message: "", type: "instructor",
        }),
      });
      toast.success("অ্যাপ্রুভ হয়েছে। এখন অ্যাডমিন কোর্স থেকে ফুল কোর্স তৈরি করুন।");
    } else {
      await fetch("/api/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: instructorId,
          userTitle: "কোর্স রিজেক্ট হয়েছে",
          userMessage: `"${title}" কোর্স রিজেক্ট করা হয়েছে। সংশোধন করে আবার সাবমিট করুন।`,
          userLink: "/instructor",
          title: "", message: "", type: "instructor",
        }),
      });
      toast.success("রিজেক্ট করা হয়েছে");
    }
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ইন্সট্রাক্টর ম্যানেজমেন্ট</h1>

      {/* Tabs */}
      <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex gap-1 rounded-full border bg-muted/50 p-1 w-fit">
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "applications" ? "bg-purple-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("applications")}
          >
            📋 আবেদনসমূহ {pendingApps > 0 && <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{pendingApps}</span>}
          </button>
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "courses" ? "bg-purple-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("courses")}
          >
            📚 কোর্স সাবমিশন {pendingCourses > 0 && <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{pendingCourses}</span>}
          </button>
        </div>

        {tab === "courses" && (
          <div className="flex flex-wrap gap-2">
            {[{ v: "pending", l: "⏳ পেন্ডিং" }, { v: "approved", l: "✅ অ্যাপ্রুভড" }, { v: "rejected", l: "❌ রিজেক্টেড" }, { v: "all", l: "সব" }].map((f) => (
              <Button key={f.v} size="sm" variant={filter === f.v ? "default" : "outline"} onClick={() => setFilter(f.v)}>{f.l}</Button>
            ))}
          </div>
        )}
      </div>

      {/* Applications tab */}
      {tab === "applications" && (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{app.full_name}</h3>
                    <p className="text-sm text-muted-foreground">📞 {app.phone} {app.email && `· 📧 ${app.email}`}</p>
                    {app.message && <p className="mt-1 text-xs text-muted-foreground">{app.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">তারিখ: {new Date(app.created_at).toLocaleDateString("bn-BD")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={app.status === "contacted" ? "outline" : "default"}
                      className={`h-7 text-xs ${app.status !== "contacted" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={async () => {
                        const next = app.status === "contacted" ? "new" : "contacted";
                        await supabase.from("service_requests").update({ status: next }).eq("id", app.id);
                        load();
                      }}
                    >
                      {app.status === "contacted" ? "আনমার্ক" : "✓ যোগাযোগ হয়েছে"}
                    </Button>
                    <Badge className={app.status === "contacted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {app.status === "contacted" ? "✓ যোগাযোগ হয়েছে" : "নতুন"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {applications.length === 0 && <p className="text-muted-foreground">কোনো আবেদন নেই।</p>}
        </div>
      )}

      {/* Course submissions tab */}
      {tab === "courses" && (
        <div className="space-y-3">
        {submissions.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{s.course_title}</h3>
                    <Badge className={`mt-1 ${s.status === "approved" ? "bg-green-100 text-green-800" : s.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {s.status === "approved" ? "✅ লাইভ" : s.status === "rejected" ? "❌ রিজেক্ট" : "⏳ পেন্ডিং"}
                    </Badge>
                  </div>
                  {s.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => updateStatus(s.id, "approved", s.instructor_id, s.course_title)}>
                        <CheckCircle className="mr-1 h-4 w-4" />অ্যাপ্রুভ
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(s.id, "rejected", s.instructor_id, s.course_title)}>
                        <XCircle className="mr-1 h-4 w-4" />রিজেক্ট
                      </Button>
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">ইন্সট্রাক্টর</p>
                    <p className="text-sm font-medium">{s.instructor_name || s.profile?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.profile?.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">মূল্য ও সময়কাল</p>
                    <p className="text-sm font-medium">৳{Number(s.price).toLocaleString()} · {s.duration_text || "—"}</p>
                  </div>
                  {s.instructor_bio && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">পরিচিতি</p>
                      <p className="text-xs text-muted-foreground">{s.instructor_bio}</p>
                    </div>
                  )}
                  {s.course_description && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">কোর্সের বিবরণ</p>
                      <p className="text-xs text-muted-foreground">{s.course_description}</p>
                    </div>
                  )}
                  {s.what_will_learn && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">কী শিখবেন</p>
                      <p className="whitespace-pre-line text-xs text-muted-foreground">{s.what_will_learn}</p>
                    </div>
                  )}
                  {s.requirements && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">পূর্বশর্ত</p>
                      <p className="whitespace-pre-line text-xs text-muted-foreground">{s.requirements}</p>
                    </div>
                  )}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  {s.course_id && (
                    <a href={`/courses/${s.course_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-700">
                      <ExternalLink className="h-3 w-3" />কোর্স প্রিভিউ দেখুন
                    </a>
                  )}
                  {s.intro_video_url && (
                    <a href={s.intro_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-sky-600 hover:bg-sky-50">
                      <ExternalLink className="h-3 w-3" />ইন্ট্রো ভিডিও
                    </a>
                  )}
                  {s.thumbnail_url && (
                    <a href={s.thumbnail_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-sky-600 hover:bg-sky-50">
                      <ExternalLink className="h-3 w-3" />থাম্বনেইল
                    </a>
                  )}
                  {s.instructor_avatar && (
                    <a href={s.instructor_avatar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-sky-600 hover:bg-sky-50">
                      <ExternalLink className="h-3 w-3" />ইন্সট্রাক্টর ছবি
                    </a>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">সাবমিট: {new Date(s.created_at).toLocaleDateString("bn-BD")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && <p className="text-muted-foreground">কোনো সাবমিশন নেই।</p>}
        </div>
      )}
    </div>
  );
}
