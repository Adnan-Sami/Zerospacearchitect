"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Loader2, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toBn } from "@/lib/utils";

export default function AdminPublicInstructors() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Course assignment state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("public_instructors")
      .select("*")
      .order("sort_order");
    setItems(data ?? []);

    // Mark unseen instructors as seen
    if (data && data.length > 0) {
      const unseenIds = data.filter((p: any) => p.is_seen === false).map((p: any) => p.id);
      if (unseenIds.length > 0) {
        await supabase
          .from("public_instructors")
          .update({ is_seen: true })
          .in("id", unseenIds);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.error("নাম দিন");
      return;
    }
    const payload = {
      name: editing.name.trim(),
      title: editing.title?.trim() || "",
      designation: editing.designation?.trim() || "",
      bio: editing.bio?.trim() || "",
      image_url: editing.image_url?.trim() || "",
      facebook_url: editing.facebook_url?.trim() || null,
      youtube_url: editing.youtube_url?.trim() || null,
      total_courses: Number(editing.total_courses) || 0,
      total_students: Number(editing.total_students) || 0,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };

    const { error } = editing.id
      ? await supabase.from("public_instructors").update(payload).eq("id", editing.id)
      : await supabase.from("public_instructors").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("public_instructors").delete().eq("id", id);
    await supabase.from("instructor_assigned_courses").delete().eq("instructor_id", id);
    toast.success("ডিলিট হয়েছে");
    load();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `instructors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setEditing((prev: any) => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
  };

  // Course assignment functions
  const openAssignCourses = async (instructorId: string) => {
    setAssigningId(instructorId);
    setCourseSearch("");

    // Fetch all published courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, thumbnail_url, price")
      .eq("is_published", true)
      .order("title");
    setAllCourses(courses ?? []);

    // Fetch already assigned courses
    const { data: assigned } = await supabase
      .from("instructor_assigned_courses")
      .select("course_id")
      .eq("instructor_id", instructorId);
    setAssignedCourseIds((assigned ?? []).map((a: any) => a.course_id));
  };

  const toggleCourse = async (courseId: string) => {
    if (!assigningId) return;

    if (assignedCourseIds.includes(courseId)) {
      // Remove
      await supabase
        .from("instructor_assigned_courses")
        .delete()
        .eq("instructor_id", assigningId)
        .eq("course_id", courseId);
      setAssignedCourseIds((prev) => prev.filter((id) => id !== courseId));
      toast.success("কোর্স সরানো হয়েছে");
    } else {
      // Add
      const { error } = await supabase
        .from("instructor_assigned_courses")
        .insert({ instructor_id: assigningId, course_id: courseId });
      if (error) {
        toast.error(error.message);
        return;
      }
      setAssignedCourseIds((prev) => [...prev, courseId]);
      toast.success("কোর্স অ্যাসাইন হয়েছে");
    }
  };

  const filteredCourses = allCourses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">প্রশিক্ষক প্রোফাইল ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">পাবলিক পেজে দেখানো প্রশিক্ষকদের তথ্য যোগ/এডিট করুন</p>
        </div>
        <Button onClick={() => setEditing({ is_active: true, sort_order: items.length, total_courses: 0, total_students: 0 })}>
          <Plus className="mr-1 h-4 w-4" />নতুন প্রশিক্ষক
        </Button>
      </div>

      {/* Edit/Create Form */}
      {editing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing.id ? "এডিট" : "নতুন"} প্রশিক্ষক</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>নাম *</Label>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="যেমন: Professor Dr. Jahangir Alam"
                />
              </div>
              <div>
                <Label>পদবী / টাইটেল</Label>
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="যেমন: Founder of Qlearn"
                />
              </div>
            </div>

            <div>
              <Label>ডেজিগনেশন</Label>
              <Input
                value={editing.designation ?? ""}
                onChange={(e) => setEditing({ ...editing, designation: e.target.value })}
                placeholder="যেমন: Professor of Civil Engineering, BUET, Dhaka"
              />
            </div>

            <div>
              <Label>বায়ো / পরিচিতি</Label>
              <Textarea
                rows={4}
                value={editing.bio ?? ""}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                placeholder="প্রশিক্ষকের সংক্ষিপ্ত পরিচিতি লিখুন..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={editing.facebook_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input
                  value={editing.youtube_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>মোট কোর্স</Label>
                <Input
                  type="number"
                  value={editing.total_courses ?? 0}
                  onChange={(e) => setEditing({ ...editing, total_courses: e.target.value })}
                />
              </div>
              <div>
                <Label>মোট শিক্ষার্থী</Label>
                <Input
                  type="number"
                  value={editing.total_students ?? 0}
                  onChange={(e) => setEditing({ ...editing, total_students: e.target.value })}
                />
              </div>
              <div>
                <Label>সাজানোর ক্রম</Label>
                <Input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>ছবি আপলোড</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              {uploading && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />আপলোড হচ্ছে...</p>}
              {editing.image_url && (
                <Image src={editing.image_url} alt="" width={100} height={100} className="mt-2 h-20 w-20 rounded-full object-cover" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editing.is_active ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
              />
              <Label>অ্যাক্টিভ (পাবলিক পেজে দেখাবে)</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={save}>সেভ করুন</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor List */}
      <div className="space-y-3">
        {items.map((inst) => (
          <Card key={inst.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {inst.image_url ? (
                <Image src={inst.image_url} alt={inst.name} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-700">
                  {inst.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{inst.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {inst.title || inst.designation || "—"} · {toBn(inst.total_courses)} কোর্স · {toBn(inst.total_students)} শিক্ষার্থী
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {inst.is_active ? "✅ অ্যাক্টিভ" : "🔒 নিষ্ক্রিয়"} · ক্রম: {toBn(inst.sort_order)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openAssignCourses(inst.id)} title="কোর্স অ্যাসাইন">
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(inst)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => del(inst.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">কোনো প্রশিক্ষক যোগ করা হয়নি। উপরে &quot;নতুন প্রশিক্ষক&quot; বাটনে ক্লিক করুন।</p>
        )}
      </div>

      {/* Course Assignment Modal */}
      {assigningId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setAssigningId(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="font-bold">কোর্স অ্যাসাইন করুন</h3>
                <p className="text-xs text-muted-foreground">
                  {items.find((i) => i.id === assigningId)?.name} — {assignedCourseIds.length} টি কোর্স অ্যাসাইন করা হয়েছে
                </p>
              </div>
              <button className="rounded-full p-1 hover:bg-gray-100" onClick={() => setAssigningId(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-3">
              <Input
                placeholder="কোর্স সার্চ করুন..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
              {filteredCourses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">কোনো কোর্স পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-2">
                  {filteredCourses.map((course) => {
                    const isAssigned = assignedCourseIds.includes(course.id);
                    return (
                      <div
                        key={course.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          isAssigned ? "border-sky-300 bg-sky-50" : "hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleCourse(course.id)}
                      >
                        {course.thumbnail_url ? (
                          <Image src={course.thumbnail_url} alt="" width={48} height={32} className="h-10 w-14 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400">IMG</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{course.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {course.price > 0 ? `৳${course.price}` : "ফ্রি"}
                          </p>
                        </div>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                          isAssigned ? "border-sky-500 bg-sky-500 text-white" : "border-gray-300"
                        }`}>
                          {isAssigned && "✓"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
