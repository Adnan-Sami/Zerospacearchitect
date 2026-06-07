"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function InstructorCourses() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("instructor_courses")
        .select("*")
        .eq("instructor_id", session.user.id)
        .order("created_at", { ascending: false });
      setCourses(data ?? []);
    });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">আমার কোর্সসমূহ</h1>
        <Link href="/instructor/upload">
          <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="mr-1 h-4 w-4" />নতুন কোর্স</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {courses.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{c.course_title}</p>
                <p className="text-xs text-muted-foreground">
                  ৳{Number(c.price).toLocaleString()} · {c.duration_text || "—"} · সাবমিট: {new Date(c.created_at).toLocaleDateString("bn-BD")}
                </p>
                {c.admin_note && <p className="mt-1 text-xs text-muted-foreground">অ্যাডমিন নোট: {c.admin_note}</p>}
              </div>
              <div className="flex items-center gap-2">
                {c.status === "draft" && c.course_id && (
                  <Link href={`/instructor/edit/${c.course_id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">✏️ এডিট</Button>
                  </Link>
                )}
                <Badge className={c.status === "approved" ? "bg-green-100 text-green-800" : c.status === "rejected" ? "bg-red-100 text-red-800" : c.status === "draft" ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"}>
                  {c.status === "approved" ? "✅ অ্যাপ্রুভড" : c.status === "rejected" ? "❌ রিজেক্ট" : c.status === "draft" ? "📝 ড্রাফট" : "⏳ পেন্ডিং"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && <p className="py-10 text-center text-muted-foreground">কোনো কোর্স নেই। নতুন কোর্স আপলোড করুন।</p>}
      </div>
    </div>
  );
}
