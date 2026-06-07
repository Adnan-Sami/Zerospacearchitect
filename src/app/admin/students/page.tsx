"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle, ChevronDown, ChevronUp, Award, Pencil, Save, X, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Period = "all" | "this_month" | "last_month" | "this_year";

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const toggleBan = async (s: any) => {
    const next = !s.is_banned;
    const { error } = await supabase.from("profiles").update({ is_banned: next }).eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success(next ? "ব্যান করা হয়েছে" : "আনব্যান করা হয়েছে"); load(); }
  };

  const loadStudentDetail = async (userId: string) => {
    if (expandedStudent === userId) { setExpandedStudent(null); setStudentDetail(null); return; }
    setExpandedStudent(userId);
    setStudentDetail(null);

    // Load enrollments with courses
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("*, courses(id, title)")
      .eq("user_id", userId);

    // For each enrolled course, get lesson count and progress
    const enriched = await Promise.all(
      (enrollments ?? []).map(async (e: any) => {
        const courseId = e.courses?.id;
        if (!courseId) return { courseId: null, courseTitle: "—", progress: 0, totalLessons: 0 };

        // Get all lessons for this course
        const { data: modules } = await supabase
          .from("modules")
          .select("id, lessons(id)")
          .eq("course_id", courseId);

        const allLessonIds = (modules ?? []).flatMap((m: any) => m.lessons?.map((l: any) => l.id) ?? []);
        const totalLessons = allLessonIds.length;

        if (totalLessons === 0) return { courseId, courseTitle: e.courses?.title, progress: 0, totalLessons: 0 };

        // Get completed lessons for this student
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .eq("completed", true)
          .in("lesson_id", allLessonIds);

        const completedCount = progressData?.length ?? 0;
        const progress = Math.round((completedCount / totalLessons) * 100);

        return { courseId, courseTitle: e.courses?.title, progress, totalLessons };
      })
    );

    // Load certificates
    const { data: certs } = await supabase
      .from("certificates")
      .select("*, courses(title)")
      .eq("user_id", userId);

    setStudentDetail({
      enrollments: enriched,
      certificates: certs ?? [],
    });
  };

  const updateCertName = async () => {
    if (!editingCertId || !editName.trim()) return;
    // Update the student's profile name
    const cert = studentDetail?.certificates.find((c: any) => c.id === editingCertId);
    if (cert) {
      await supabase.from("profiles").update({ full_name: editName.trim() }).eq("user_id", cert.user_id);
      toast.success("নাম আপডেট হয়েছে। সার্টিফিকেটে নতুন নাম দেখাবে।");
    }
    setEditingCertId(null);
    setEditName("");
    load();
  };

  const getDateFilter = (p: Period) => {
    const now = new Date();
    if (p === "this_month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (p === "last_month") return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    if (p === "this_year") return new Date(now.getFullYear(), 0, 1);
    return null;
  };

  const getDateEnd = (p: Period) => {
    const now = new Date();
    if (p === "last_month") return new Date(now.getFullYear(), now.getMonth(), 1);
    return null;
  };

  const filtered = students.filter((s) => {
    // Search filter
    const matchesSearch = !search ||
      (s.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search);
    if (!matchesSearch) return false;

    // Period filter
    const dateFrom = getDateFilter(period);
    const dateEnd = getDateEnd(period);
    if (dateFrom) {
      const joined = new Date(s.created_at);
      if (joined < dateFrom) return false;
      if (dateEnd && joined >= dateEnd) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ["নাম", "ফোন", "যোগদান তারিখ", "স্ট্যাটাস"];
    const rows = filtered.map((s) => [
      s.full_name || "—",
      s.phone || "—",
      new Date(s.created_at).toLocaleDateString("bn-BD"),
      s.is_banned ? "ব্যানড" : "সক্রিয়",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students-${period}.csv`;
    link.click();
  };

  const exportAllMonths = () => {
    const months: Record<string, any[]> = {};
    students.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = [];
      months[key].push(s);
    });

    const headers = ["মাস", "নাম", "ফোন", "যোগদান তারিখ", "স্ট্যাটাস"];
    const rows: string[][] = [];
    Object.keys(months).sort().reverse().forEach((month) => {
      months[month].forEach((s) => {
        rows.push([
          month,
          s.full_name || "—",
          s.phone || "—",
          new Date(s.created_at).toLocaleDateString("bn-BD"),
          s.is_banned ? "ব্যানড" : "সক্রিয়",
        ]);
      });
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students-all-months.csv`;
    link.click();
  };

  const periodLabel = (p: Period) => {
    if (p === "this_month") return "এই মাস";
    if (p === "last_month") return "গত মাস";
    if (p === "this_year") return "এই বছর";
    return "সব সময়";
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">শিক্ষার্থী তালিকা ({filtered.length})</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="mr-1 h-3 w-3" />এই ফিল্টার CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportAllMonths}>
            <Download className="mr-1 h-3 w-3" />মাসওয়ারি CSV
          </Button>
        </div>
      </div>

      {/* Filter card */}
      <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm space-y-3">
        <Input
          placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {([
            { v: "all" as Period, l: "সব সময়" },
            { v: "this_month" as Period, l: "এই মাস" },
            { v: "last_month" as Period, l: "গত মাস" },
            { v: "this_year" as Period, l: "এই বছর" },
          ]).map((p) => (
            <Button
              key={p.v}
              size="sm"
              variant={period === p.v ? "default" : "outline"}
              className={period === p.v ? "bg-sky-600 hover:bg-sky-700" : ""}
              onClick={() => setPeriod(p.v)}
            >
              {p.l}
            </Button>
          ))}
        </div>
        {/* Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-sky-500" />{filtered.length} জন ({periodLabel(period)})</span>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <Card key={s.id} className={s.is_banned ? "border-destructive/40 bg-destructive/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                    {filtered.indexOf(s) + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {s.full_name || "নাম নেই"}
                      {s.is_banned && <Badge variant="destructive" className="ml-2">ব্যানড</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {s.phone || "ফোন নেই"} · যোগদান: {new Date(s.created_at).toLocaleDateString("bn-BD")}
                      {s.device_info && <span className="ml-2 text-xs">📱 {s.device_info}</span>}
                    </p>
                    {s.last_ip && (
                      <p className="text-xs text-muted-foreground">🌐 IP: {s.last_ip}</p>
                    )}
                    {s.is_banned && (
                      <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-0.5 inline-block">
                        ⚠️ ব্যান কারণ: ভিন্ন ডিভাইস থেকে লগইন চেষ্টা
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadStudentDetail(s.user_id)}
                  >
                    {expandedStudent === s.user_id ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
                    বিস্তারিত
                  </Button>
                  {s.device_fingerprint && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={async () => {
                        await supabase.from("profiles").update({ device_fingerprint: null, device_info: null }).eq("id", s.id);
                        toast.success("ডিভাইস রিসেট হয়েছে");
                        load();
                      }}
                    >
                      🔄 ডিভাইস রিসেট
                    </Button>
                  )}
                  {s.last_ip && s.is_banned && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={async () => {
                        await supabase.from("banned_ips").delete().eq("ip_address", s.last_ip);
                        toast.success("IP আনব্যান হয়েছে");
                      }}
                    >
                      🌐 IP আনব্যান
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={s.is_banned ? "outline" : "destructive"}
                    onClick={() => toggleBan(s)}
                  >
                    {s.is_banned ? <><CheckCircle className="mr-1 h-4 w-4" />আনব্যান</> : <><Ban className="mr-1 h-4 w-4" />ব্যান</>}
                  </Button>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedStudent === s.user_id && (
                <div className="mt-4 border-t pt-4 space-y-4">
                  {!studentDetail ? (
                    <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
                  ) : (
                    <>
                      {/* Course Progress */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">কোর্স অগ্রগতি</h4>
                        {studentDetail.enrollments.length > 0 ? (
                          <div className="space-y-2">
                            {studentDetail.enrollments.map((e: any) => (
                              <div key={e.courseId} className="rounded-lg border bg-muted/20 p-3">
                                <div className="mb-1 flex items-center justify-between text-sm">
                                  <span className="font-medium">{e.courseTitle}</span>
                                  <span className={`text-xs font-semibold ${e.progress === 100 ? "text-green-600" : "text-muted-foreground"}`}>
                                    {e.progress}%
                                  </span>
                                </div>
                                <Progress value={e.progress} className="h-2" />
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {e.totalLessons} লেসন · {e.progress === 100 ? "✅ সম্পন্ন" : "চলমান"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">কোনো কোর্সে এনরোল নেই</p>
                        )}
                      </div>

                      {/* Certificates */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold flex items-center gap-1">
                          <Award className="h-4 w-4 text-primary" />
                          সার্টিফিকেট ({studentDetail.certificates.length})
                        </h4>
                        {studentDetail.certificates.length > 0 ? (
                          <div className="space-y-2">
                            {studentDetail.certificates.map((cert: any) => (
                              <div key={cert.id} className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
                                <div>
                                  <p className="text-sm font-medium">{cert.courses?.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    নং: <span className="font-mono">{cert.certificate_number}</span> · ইস্যু: {new Date(cert.issued_at).toLocaleDateString("bn-BD")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {editingCertId === cert.id ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-7 w-40 text-xs"
                                        placeholder="নতুন নাম"
                                      />
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={updateCertName}><Save className="h-3 w-3" /></Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCertId(null)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => { setEditingCertId(cert.id); setEditName(s.full_name || ""); }}
                                    >
                                      <Pencil className="mr-1 h-3 w-3" />নাম পরিবর্তন
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">এখনো কোনো সার্টিফিকেট অর্জন হয়নি</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">কোনো শিক্ষার্থী নেই।</p>}
      </div>
    </div>
  );
}
