"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InstructorCourses() {
  const [courses, setCourses] = useState<any[]>([]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("instructor_courses")
      .select("*")
      .eq("instructor_id", session.user.id)
      .order("created_at", { ascending: false });
    setCourses(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const deleteCourse = async (id: string, courseId: string | null) => {
    if (!confirm("এই কোর্স ডিলিট করতে চান?")) return;
    // Delete from instructor_courses
    await supabase.from("instructor_courses").delete().eq("id", id);
    // If course was created in courses table, delete it too
    if (courseId) {
      await supabase.from("lessons").delete().in("module_id",
        (await supabase.from("modules").select("id").eq("course_id", courseId)).data?.map((m: any) => m.id) ?? []
      );
      await supabase.from("modules").delete().eq("course_id", courseId);
      await supabase.from("courses").delete().eq("id", courseId);
    }
    toast.success("কোর্স ডিলিট হয়েছে");
    load();
  };

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
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{c.course_title}</p>
                <p className="text-xs text-muted-foreground">
                  ৳{Number(c.price || 0).toLocaleString()} · {c.duration_text || "—"} · সাবমিট: {new Date(c.created_at).toLocaleDateString("bn-BD")}
                </p>
                {c.admin_note && <p className="mt-1 text-xs text-orange-600">📝 অ্যাডমিন নোট: {c.admin_note}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Preview */}
                {c.course_id && (
                  <Link href={`/courses/${c.course_id}`} target="_blank">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Eye className="mr-1 h-3 w-3" />প্রিভিউ
                    </Button>
                  </Link>
                )}
                {/* Edit - only for draft/rejected */}
                {(c.status === "draft" || c.status === "rejected") && c.course_id && (
                  <Link href={`/instructor/edit/${c.course_id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Pencil className="mr-1 h-3 w-3" />এডিট
                    </Button>
                  </Link>
                )}
                {/* Delete - only for draft/rejected */}
                {(c.status === "draft" || c.status === "rejected") && (
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => deleteCourse(c.id, c.course_id)}>
                    <Trash2 className="mr-1 h-3 w-3" />ডিলিট
                  </Button>
                )}
                {/* Status badge */}
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
