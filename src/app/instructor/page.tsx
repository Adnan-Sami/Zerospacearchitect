"use client";

import { useEffect, useState } from "react";
import { BookOpen, DollarSign, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function InstructorDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, earnings: 0 });
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("instructor_courses")
        .select("course_id, course_title, status")
        .eq("instructor_id", session.user.id)
        .order("created_at", { ascending: false });

      const list = data ?? [];
      setCourses(list);
      const published = list.filter((c: any) => c.status === "approved").length;
      const pending = list.filter((c: any) => c.status === "pending").length;

      // Get earnings from server API (bypasses RLS)
      const res = await fetch("/api/instructor-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId: session.user.id }),
      });
      const earningsData = await res.json();

      setStats({ total: list.length, published, pending, earnings: earningsData.total ?? 0 });
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ইন্সট্রাক্টর ড্যাশবোর্ড</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">মোট কোর্স</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">পাবলিশড</p><p className="mt-1 text-2xl font-bold">{stats.published}</p></div>
            <Eye className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">পেন্ডিং</p><p className="mt-1 text-2xl font-bold">{stats.pending}</p></div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">আনুমানিক আয়</p><p className="mt-1 text-2xl font-bold">৳{stats.earnings.toLocaleString()}</p></div>
            <DollarSign className="h-8 w-8 text-sky-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">আমার কোর্সসমূহ</CardTitle></CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো কোর্স আপলোড করা হয়নি।</p>
          ) : (
            <div className="space-y-3">
              {courses.map((c: any) => (
                <div key={c.course_id || c.course_title} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{c.course_title}</p>
                  </div>
                  <Badge className={c.status === "approved" ? "bg-green-100 text-green-800" : c.status === "rejected" ? "bg-red-100 text-red-800" : c.status === "draft" ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"}>
                    {c.status === "approved" ? "✅ অ্যাপ্রুভড" : c.status === "rejected" ? "❌ রিজেক্ট" : c.status === "draft" ? "📝 ড্রাফট" : "⏳ পেন্ডিং"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
