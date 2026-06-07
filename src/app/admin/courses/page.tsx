"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Upload, Loader2,
  ImageIcon, Video, HelpCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Certificate } from "@/components/Certificate";

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // inline module/lesson drafts
  const [topicDraft, setTopicDraft] = useState<{ title: string; summary: string } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<{ moduleId: string; title: string; videoUrl: string; duration: string } | null>(null);
  const [quizDraft, setQuizDraft] = useState<{ moduleId: string; title: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0 });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0 });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState({ title: "", videoUrl: "", duration: "" });

  const loadCourses = async () => {
    const { data } = await supabase.from("courses").select("*, categories(name)").order("created_at", { ascending: false });
    setCourses(data ?? []);
  };
  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data ?? []);
  };
  const loadModules = async (courseId: string) => {
    const { data } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("sort_order");
    setModules(data ?? []);
  };

  useEffect(() => { loadCourses(); loadCategories(); }, []);

  const openNew = () => {
    setEditing({ title: "", description: "", thumbnail_url: "", intro_video_url: "", price: 0, original_price: null, duration_text: "", enrollment_count: 0, category_id: null, instructor_name: "", instructor_bio: "", instructor_avatar: "", is_published: false, what_will_learn: "", requirements: "", target_audience: "", materials_included: "", certificate_enabled: true, certificate_title: "", certificate_body: "", certificate_signature: "" });
    setModules([]);
    setExpandedModules(new Set());
  };
  const openEdit = async (course: any) => {
    setEditing(course);
    await loadModules(course.id);
    setExpandedModules(new Set());
  };
  const close = () => { setEditing(null); setModules([]); setTopicDraft(null); setLessonDraft(null); setQuizDraft(null); };

  const save = async () => {
    if (!editing.title?.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    setSaving(true);
    const slug = editing.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");
    const payload: any = { ...editing, slug };
    delete payload.categories;
    if (!payload.category_id) payload.category_id = null;

    let courseId = editing.id;
    if (!courseId) {
      delete payload.id;
      const { data, error } = await supabase.from("courses").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      courseId = data.id;
      setEditing((p: any) => ({ ...p, id: courseId }));
    } else {
      const { error } = await supabase.from("courses").update(payload).eq("id", courseId);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success("সেভ হয়েছে");
    setSaving(false);
    loadCourses();
    if (courseId) await loadModules(courseId);
  };

  const publish = async () => {
    if (!editing.title?.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    setSaving(true);
    const slug = editing.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");
    const payload: any = { ...editing, slug, is_published: true };
    delete payload.categories;
    if (!payload.category_id) payload.category_id = null;

    let courseId = editing.id;
    if (!courseId) {
      delete payload.id;
      const { data, error } = await supabase.from("courses").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      courseId = data.id;
      setEditing((p: any) => ({ ...p, id: courseId, is_published: true }));
    } else {
      const { error } = await supabase.from("courses").update(payload).eq("id", courseId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setEditing((p: any) => ({ ...p, is_published: true }));
    }
    toast.success("কোর্স পাবলিশ হয়েছে ✅");
    setSaving(false);
    loadCourses();
    if (courseId) await loadModules(courseId);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("এই কোর্সটি ডিলিট করতে চান?")) return;
    await supabase.from("courses").delete().eq("id", id);
    loadCourses();
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("শুধু ইমেজ ফাইল আপলোড করুন"); return; }
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(fileName, file);
    if (error) { toast.error(error.message); setUploadingImage(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(fileName);
    setEditing((p: any) => ({ ...p, thumbnail_url: data.publicUrl }));
    toast.success("ইমেজ আপলোড হয়েছে");
    setUploadingImage(false);
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("শুধু ইমেজ ফাইল আপলোড করুন"); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(fileName, file);
    if (error) { toast.error(error.message); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(fileName);
    setEditing((p: any) => ({ ...p, instructor_avatar: data.publicUrl }));
    toast.success("আভাটার আপলোড হয়েছে");
    setUploadingAvatar(false);
  };

  const addCategory = async () => {
    const name = newCategoryName.trim(); if (!name) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) { toast.error(error.message); return; }
    setNewCategoryName(""); loadCategories();
  };

  // Curriculum helpers
  const courseId = editing?.id;
  const toggleModule = (id: string) => setExpandedModules(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const saveTopicDraft = async () => {
    if (!courseId || !topicDraft?.title.trim()) { toast.error("টপিকের নাম দিন"); return; }
    const { error } = await supabase.from("modules").insert({ course_id: courseId, title: topicDraft.title.trim(), summary: topicDraft.summary.trim() || null, sort_order: modules.length });
    if (error) { toast.error(error.message); return; }
    setTopicDraft(null); loadModules(courseId);
  };
  const deleteModule = async (moduleId: string) => {
    if (!confirm("এই টপিক ডিলিট করবেন?")) return;
    await supabase.from("modules").delete().eq("id", moduleId);
    if (courseId) loadModules(courseId);
  };
  const saveLessonDraft = async () => {
    if (!lessonDraft?.title.trim()) { toast.error("লেসনের নাম দিন"); return; }
    const mod = modules.find(m => m.id === lessonDraft.moduleId);
    const { error } = await supabase.from("lessons").insert({ module_id: lessonDraft.moduleId, title: lessonDraft.title.trim(), video_url: lessonDraft.videoUrl.trim() || null, duration_minutes: parseInt(lessonDraft.duration) || 0, lesson_type: "lesson", sort_order: mod?.lessons?.length ?? 0 });
    if (error) { toast.error(error.message); return; }
    setLessonDraft(null); if (courseId) loadModules(courseId);
  };
  const saveQuizDraft = async () => {
    if (!quizDraft?.title.trim()) { toast.error("কুইজের নাম দিন"); return; }
    const mod = modules.find(m => m.id === quizDraft.moduleId);
    const { error } = await supabase.from("lessons").insert({ module_id: quizDraft.moduleId, title: quizDraft.title.trim(), lesson_type: "quiz", sort_order: mod?.lessons?.length ?? 0 });
    if (error) { toast.error(error.message); return; }
    setQuizDraft(null); if (courseId) loadModules(courseId);
  };
  const deleteLesson = async (lessonId: string) => {
    await supabase.from("lessons").delete().eq("id", lessonId);
    if (courseId) loadModules(courseId);
    if (editingQuizId === lessonId) setEditingQuizId(null);
  };

  // Quiz question management
  const openQuizEditor = async (lessonId: string) => {
    if (editingQuizId === lessonId) { setEditingQuizId(null); return; }
    setEditingQuizId(lessonId);
    const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", lessonId).order("sort_order");
    setQuizQuestions(data ?? []);
    setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 });
  };

  const addQuestion = async () => {
    if (!editingQuizId || !newQuestion.question.trim()) { toast.error("প্রশ্ন লিখুন"); return; }
    const filledOptions = newQuestion.options.filter(o => o.trim());
    if (filledOptions.length < 2) { toast.error("কমপক্ষে ২টি অপশন দিন"); return; }
    const { error } = await supabase.from("quiz_questions").insert({
      lesson_id: editingQuizId,
      question: newQuestion.question.trim(),
      options: filledOptions,
      correct_answer: newQuestion.correct_answer,
      sort_order: quizQuestions.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("প্রশ্ন যোগ হয়েছে");
    setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 });
    const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order");
    setQuizQuestions(data ?? []);
  };

  const deleteQuestion = async (qId: string) => {
    if (!editingQuizId) return;
    await supabase.from("quiz_questions").delete().eq("id", qId);
    const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order");
    setQuizQuestions(data ?? []);
  };

  const startEditQuestion = (q: any) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    // Pad to 4 options
    const padded = [...opts, "", "", "", ""].slice(0, 4);
    setEditingQuestionId(q.id);
    setEditQuestion({ question: q.question, options: padded, correct_answer: q.correct_answer });
  };

  const saveEditQuestion = async () => {
    if (!editingQuestionId || !editQuestion.question.trim()) { return; }
    const filledOptions = editQuestion.options.filter(o => o.trim());
    if (filledOptions.length < 2) { return; }
    await supabase.from("quiz_questions").update({
      question: editQuestion.question.trim(),
      options: filledOptions,
      correct_answer: editQuestion.correct_answer,
    }).eq("id", editingQuestionId);
    setEditingQuestionId(null);
    if (editingQuizId) {
      const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order");
      setQuizQuestions(data ?? []);
    }
  };

  const startEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setEditLesson({ title: lesson.title, videoUrl: lesson.video_url || "", duration: String(lesson.duration_minutes || "") });
  };

  const saveEditLesson = async () => {
    if (!editingLessonId || !editLesson.title.trim()) { toast.error("লেসনের নাম দিন"); return; }
    await supabase.from("lessons").update({
      title: editLesson.title.trim(),
      video_url: editLesson.videoUrl.trim() || null,
      duration_minutes: parseInt(editLesson.duration) || 0,
    }).eq("id", editingLessonId);
    setEditingLessonId(null);
    if (courseId) loadModules(courseId);
  };

  // ── LIST VIEW ──────────────────────────────────────────────
  if (!editing) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">কোর্স ম্যানেজমেন্ট</h1>
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />নতুন কোর্স</Button>
        </div>

        {/* Categories */}
        <Card className="mb-5">
          <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ক্যাটেগরি</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex gap-2">
              <Input placeholder="নতুন ক্যাটেগরির নাম" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <Button size="sm" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm">
                  {c.name}
                  <button onClick={async () => { if (confirm("ডিলিট করবেন?")) { await supabase.from("categories").delete().eq("id", c.id); loadCategories(); } }} className="ml-1 text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted-foreground">কোনো ক্যাটেগরি নেই</p>}
            </div>
          </CardContent>
        </Card>

        {/* Course list */}
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
                  {course.thumbnail_url && <Image src={course.thumbnail_url} alt="" width={80} height={56} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.categories?.name && <span className="mr-2 rounded bg-muted px-1.5 py-0.5">{course.categories.name}</span>}
                    ৳{Number(course.price).toLocaleString()} · {course.is_published ? "✅ পাবলিশড" : "🔒 ড্রাফট"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(course)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteCourse(course.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && <p className="py-10 text-center text-muted-foreground">কোনো কোর্স নেই</p>}
        </div>
      </div>
    );
  }

  // ── EDIT / CREATE VIEW ────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={close}><X className="h-4 w-4" /></Button>
          <h1 className="text-xl font-bold">{editing.id ? "কোর্স এডিট" : "নতুন কোর্স"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch checked={editing.is_published ?? false} onCheckedChange={(v) => setEditing((p: any) => ({ ...p, is_published: v }))} />
            <span className={`text-sm font-medium ${editing.is_published ? "text-green-600" : "text-muted-foreground"}`}>
              {editing.is_published ? "✅ পাবলিশড" : "🔒 ড্রাফট"}
            </span>
          </div>
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            সেভ করুন
          </Button>
          {!editing.is_published && (
            <Button
              onClick={publish}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              পাবলিশ করুন
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* Basic Info */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">বেসিক তথ্য</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label>কোর্সের নাম *</Label>
                <Input value={editing.title} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} placeholder="কোর্সের নাম লিখুন" />
              </div>
              <div>
                <Label>বিবরণ</Label>
                <Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, description: e.target.value }))} placeholder="কোর্স সম্পর্কে সংক্ষিপ্ত বিবরণ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>মূল্য (৳)</Label>
                  <Input type="number" value={editing.price ?? 0} onChange={(e) => setEditing((p: any) => ({ ...p, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>পূর্বের মূল্য (৳)</Label>
                  <Input type="number" value={editing.original_price ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, original_price: e.target.value ? Number(e.target.value) : null }))} placeholder="ঐচ্ছিক" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>সময়কাল</Label>
                  <Input value={editing.duration_text ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, duration_text: e.target.value }))} placeholder="যেমন: ৪০ ঘণ্টা" />
                </div>
                <div>
                  <Label>এনরোলমেন্ট সংখ্যা</Label>
                  <Input type="number" value={editing.enrollment_count ?? 0} onChange={(e) => setEditing((p: any) => ({ ...p, enrollment_count: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>ক্যাটেগরি</Label>
                <select
                  value={editing.category_id ?? ""}
                  onChange={(e) => setEditing((p: any) => ({ ...p, category_id: e.target.value || null }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">— ক্যাটেগরি নির্বাচন করুন —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ইন্সট্রাক্টর</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Avatar */}
              <div>
                <Label>ইন্সট্রাক্টর ছবি</Label>
                <div className="mt-2 flex items-center gap-4">
                  {editing.instructor_avatar ? (
                    <div className="relative">
                      <Image src={editing.instructor_avatar} alt="" width={72} height={72} className="h-18 w-18 rounded-full object-cover border" />
                      <button onClick={() => setEditing((p: any) => ({ ...p, instructor_avatar: "" }))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                  )}
                  <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                    <Upload className="mr-1 inline h-3.5 w-3.5" />
                    {uploadingAvatar ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <Label>নাম</Label>
                <Input value={editing.instructor_name ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, instructor_name: e.target.value }))} />
              </div>
              <div>
                <Label>পরিচিতি</Label>
                <Textarea rows={2} value={editing.instructor_bio ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, instructor_bio: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ওভারভিউ</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <Label>কী শিখবেন</Label>
                <Textarea rows={3} value={editing.what_will_learn ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, what_will_learn: e.target.value }))} />
              </div>
              <div>
                <Label>টার্গেট অডিয়েন্স</Label>
                <Textarea rows={2} value={editing.target_audience ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, target_audience: e.target.value }))} />
              </div>
              <div>
                <Label>পূর্বশর্ত</Label>
                <Textarea rows={2} value={editing.requirements ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, requirements: e.target.value }))} />
              </div>
              <div>
                <Label>উপকরণ</Label>
                <Textarea rows={2} value={editing.materials_included ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, materials_included: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Curriculum — only for saved courses */}
          {editing.id ? (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">কারিকুলাম</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                {modules.map((mod) => (
                  <div key={mod.id} className="rounded-lg border bg-muted/20">
                    {/* Module header */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <button className="flex flex-1 items-center gap-2 text-left font-medium text-sm" onClick={() => toggleModule(mod.id)}>
                        {expandedModules.has(mod.id) ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                        {mod.title}
                        <span className="ml-auto text-xs text-muted-foreground">{mod.lessons?.length ?? 0} লেসন</span>
                      </button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteModule(mod.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>

                    {expandedModules.has(mod.id) && (
                      <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                        {mod.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                          <div key={lesson.id}>
                            {editingLessonId === lesson.id ? (
                              /* Lesson edit mode */
                              <div className="space-y-2 rounded border border-primary/30 bg-background p-2">
                                <Input value={editLesson.title} onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })} placeholder="লেসনের নাম" className="text-sm" />
                                {lesson.lesson_type !== "quiz" && (
                                  <>
                                    <Input value={editLesson.videoUrl} onChange={(e) => setEditLesson({ ...editLesson, videoUrl: e.target.value })} placeholder="ভিডিও URL" className="text-sm" />
                                    <Input type="number" value={editLesson.duration} onChange={(e) => setEditLesson({ ...editLesson, duration: e.target.value })} placeholder="সময়কাল (মিনিট)" className="text-sm" />
                                  </>
                                )}
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingLessonId(null)}>বাতিল</Button>
                                  <Button size="sm" onClick={saveEditLesson}>সেভ</Button>
                                </div>
                              </div>
                            ) : (
                              /* Lesson view mode */
                              <div className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                  {lesson.lesson_type === "quiz"
                                    ? <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                    : <Video className="h-3.5 w-3.5 text-muted-foreground" />}
                                  <span>{lesson.title}</span>
                                  {lesson.duration_minutes > 0 && <span className="text-xs text-muted-foreground">({lesson.duration_minutes} মি)</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                  {lesson.lesson_type === "quiz" && (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs text-primary" onClick={() => openQuizEditor(lesson.id)}>
                                      {editingQuizId === lesson.id ? "বন্ধ" : "প্রশ্ন"}
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditLesson(lesson)}><Pencil className="h-3 w-3" /></Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              </div>
                            )}

                            {/* Quiz Question Editor */}
                            {lesson.lesson_type === "quiz" && editingQuizId === lesson.id && (
                              <div className="ml-4 mt-2 mb-2 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-primary">কুইজ প্রশ্ন ({quizQuestions.length} টি)</p>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingQuizId(null)}>
                                    <X className="mr-1 h-3 w-3" />বন্ধ করুন
                                  </Button>
                                </div>

                                {/* Existing questions */}
                                {quizQuestions.map((q, qi) => (
                                  <div key={q.id}>
                                    {editingQuestionId === q.id ? (
                                      /* Edit mode */
                                      <div className="space-y-2 rounded border border-primary/30 bg-background p-2">
                                        <Input
                                          value={editQuestion.question}
                                          onChange={(e) => setEditQuestion({ ...editQuestion, question: e.target.value })}
                                          className="text-sm"
                                        />
                                        {editQuestion.options.map((opt, i) => (
                                          <div key={i} className="flex items-center gap-2">
                                            <input
                                              type="radio"
                                              name="edit_correct"
                                              checked={editQuestion.correct_answer === i}
                                              onChange={() => setEditQuestion({ ...editQuestion, correct_answer: i })}
                                            />
                                            <Input
                                              value={opt}
                                              onChange={(e) => {
                                                const opts = [...editQuestion.options];
                                                opts[i] = e.target.value;
                                                setEditQuestion({ ...editQuestion, options: opts });
                                              }}
                                              className="text-sm"
                                            />
                                          </div>
                                        ))}
                                        <div className="flex justify-end gap-2">
                                          <Button size="sm" variant="ghost" onClick={() => setEditingQuestionId(null)}>বাতিল</Button>
                                          <Button size="sm" onClick={saveEditQuestion}>সেভ</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* View mode */
                                      <div className="flex items-start justify-between gap-2 rounded border bg-background p-2 text-xs">
                                        <div className="flex-1">
                                          <p className="font-medium">{qi + 1}. {q.question}</p>
                                          <div className="mt-1 space-y-0.5">
                                            {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                                              <p key={oi} className={oi === q.correct_answer ? "font-semibold text-green-600" : "text-muted-foreground"}>
                                                {oi === q.correct_answer ? "✓ " : "• "}{opt}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => startEditQuestion(q)}><Pencil className="h-3 w-3" /></Button>
                                          <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Add new question */}
                                <div className="space-y-2 rounded border bg-background p-2">
                                  <Input
                                    placeholder="প্রশ্ন লিখুন"
                                    value={newQuestion.question}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                    className="text-sm"
                                  />
                                  {newQuestion.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={newQuestion.correct_answer === i}
                                        onChange={() => setNewQuestion({ ...newQuestion, correct_answer: i })}
                                        title="সঠিক উত্তর"
                                      />
                                      <Input
                                        placeholder={`অপশন ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                          const opts = [...newQuestion.options];
                                          opts[i] = e.target.value;
                                          setNewQuestion({ ...newQuestion, options: opts });
                                        }}
                                        className="text-sm"
                                      />
                                    </div>
                                  ))}
                                  <p className="text-[10px] text-muted-foreground">রেডিও বাটন দিয়ে সঠিক উত্তর নির্বাচন করুন</p>
                                  <Button size="sm" onClick={addQuestion}><Plus className="mr-1 h-3 w-3" />প্রশ্ন যোগ করুন</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Lesson draft */}
                        {lessonDraft?.moduleId === mod.id && (
                          <div className="space-y-2 rounded border bg-background p-2">
                            <Input placeholder="লেসনের নাম" value={lessonDraft.title} onChange={(e) => setLessonDraft((d) => d && { ...d, title: e.target.value })} />
                            <Input placeholder="ভিডিও URL" value={lessonDraft.videoUrl} onChange={(e) => setLessonDraft((d) => d && { ...d, videoUrl: e.target.value })} />
                            <Input type="number" placeholder="সময়কাল (মিনিট)" value={lessonDraft.duration} onChange={(e) => setLessonDraft((d) => d && { ...d, duration: e.target.value })} />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setLessonDraft(null)}>বাতিল</Button>
                              <Button size="sm" onClick={saveLessonDraft}>যোগ করুন</Button>
                            </div>
                          </div>
                        )}

                        {/* Quiz draft */}
                        {quizDraft?.moduleId === mod.id && (
                          <div className="space-y-2 rounded border bg-background p-2">
                            <Input placeholder="কুইজের নাম" value={quizDraft.title} onChange={(e) => setQuizDraft((d) => d && { ...d, title: e.target.value })} />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setQuizDraft(null)}>বাতিল</Button>
                              <Button size="sm" onClick={saveQuizDraft}>যোগ করুন</Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={() => { setLessonDraft({ moduleId: mod.id, title: "", videoUrl: "", duration: "" }); setQuizDraft(null); }}>
                            <Plus className="mr-1 h-3 w-3" />লেসন
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setQuizDraft({ moduleId: mod.id, title: "" }); setLessonDraft(null); }}>
                            <Plus className="mr-1 h-3 w-3" />কুইজ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* New topic draft */}
                {topicDraft ? (
                  <div className="space-y-2 rounded-lg border-2 border-primary/30 p-3">
                    <Input placeholder="টপিকের নাম" value={topicDraft.title} onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })} autoFocus />
                    <Textarea rows={2} placeholder="সারসংক্ষেপ (ঐচ্ছিক)" value={topicDraft.summary} onChange={(e) => setTopicDraft({ ...topicDraft, summary: e.target.value })} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setTopicDraft(null)}>বাতিল</Button>
                      <Button size="sm" onClick={saveTopicDraft}>যোগ করুন</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setTopicDraft({ title: "", summary: "" })}>
                    <Plus className="mr-1 h-4 w-4" />নতুন টপিক
                  </Button>
                )}
                {modules.length === 0 && !topicDraft && (
                  <p className="py-3 text-center text-sm text-muted-foreground">কোনো টপিক নেই</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                প্রথমে কোর্স সেভ করুন, তারপর কারিকুলাম যোগ করতে পারবেন।
              </CardContent>
            </Card>
          )}

          {/* Certificate */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">সার্টিফিকেট</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.certificate_enabled ?? true} onCheckedChange={(v) => setEditing((p: any) => ({ ...p, certificate_enabled: v }))} />
                  <span className="text-sm">{editing.certificate_enabled ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                </div>
              </div>
            </CardHeader>
            {editing.certificate_enabled && (
              <CardContent className="space-y-4 pt-0">
                <div>
                  <Label>শিরোনাম</Label>
                  <Input
                    placeholder="যেমন: কোর্স সমাপ্তি সার্টিফিকেট"
                    value={editing.certificate_title ?? ""}
                    onChange={(e) => setEditing((p: any) => ({ ...p, certificate_title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>বডি টেক্সট</Label>
                  <Textarea
                    rows={2}
                    placeholder="যেমন: সফলভাবে নিম্নলিখিত কোর্সটি সম্পন্ন করার জন্য:"
                    value={editing.certificate_body ?? ""}
                    onChange={(e) => setEditing((p: any) => ({ ...p, certificate_body: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>স্বাক্ষর / পদবী (ঐচ্ছিক)</Label>
                  <Input
                    placeholder="যেমন: Engr. Dulal Reza, Founder"
                    value={editing.certificate_signature ?? ""}
                    onChange={(e) => setEditing((p: any) => ({ ...p, certificate_signature: e.target.value }))}
                  />
                </div>

                {/* Live Preview */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">লাইভ প্রিভিউ</p>
                  <div className="overflow-hidden rounded-lg border">
                    <Certificate
                      studentName="শিক্ষার্থীর নাম"
                      courseName={editing.title || "কোর্সের নাম"}
                      certificateNumber="CERT-PREVIEW"
                      issuedDate={new Date().toLocaleDateString("bn-BD")}
                      title={editing.certificate_title}
                      body={editing.certificate_body}
                      signature={editing.certificate_signature}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end gap-2 pb-6">
            <Button variant="outline" onClick={close}>বাতিল</Button>
            <Button variant="outline" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              ড্রাফট সেভ
            </Button>
            {!editing.is_published && (
              <Button onClick={publish} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                পাবলিশ করুন
              </Button>
            )}
            {editing.is_published && (
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                সেভ করুন
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Thumbnail */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">কভার ইমেজ</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              {editing.thumbnail_url ? (
                <div className="relative">
                  <Image src={editing.thumbnail_url} alt="" width={300} height={160} className="h-40 w-full rounded object-cover" />
                  <Button size="sm" variant="destructive" className="absolute right-2 top-2 h-7 w-7 p-0" onClick={() => setEditing((p: any) => ({ ...p, thumbnail_url: "" }))}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-8 text-sm hover:bg-muted transition-colors">
                  {uploadingImage ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                  <span className="text-muted-foreground">{uploadingImage ? "আপলোড হচ্ছে..." : "ছবি আপলোড করুন"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              )}
              <Input placeholder="অথবা URL পেস্ট করুন" value={editing.thumbnail_url ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, thumbnail_url: e.target.value }))} />
            </CardContent>
          </Card>

          {/* Intro video */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ইন্ট্রো ভিডিও</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              {editing.intro_video_url ? (
                <div className="flex items-start justify-between gap-2 rounded border bg-muted/30 p-2 text-xs">
                  <span className="break-all">{editing.intro_video_url}</span>
                  <button onClick={() => setEditing((p: any) => ({ ...p, intro_video_url: "" }))} className="shrink-0 text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-6">
                  <Video className="h-6 w-6 text-muted-foreground" />
                  <Input placeholder="YouTube / Vimeo URL" value={editing.intro_video_url ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, intro_video_url: e.target.value }))} className="text-xs" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
