"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Upload, Loader2, Video, HelpCircle,
  ChevronDown, ChevronUp, ImageIcon, X, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Certificate } from "@/components/Certificate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InstructorUpload() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [topicDraft, setTopicDraft] = useState<{ title: string; summary: string } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<{ moduleId: string; title: string; videoUrl: string; duration: string } | null>(null);
  const [quizDraft, setQuizDraft] = useState<{ moduleId: string; title: string } | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0 });

  const [form, setForm] = useState({
    title: "", description: "", price: "0", original_price: "",
    duration_text: "", thumbnail_url: "", intro_video_url: "",
    what_will_learn: "", requirements: "", target_audience: "",
    materials_included: "", instructor_name: "", instructor_bio: "",
    instructor_avatar: "", certificate_enabled: true,
    certificate_title: "", certificate_body: "", certificate_signature: "",
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const path = `instructor/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) { toast.error(error.message); setUploadingImage(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setForm((p) => ({ ...p, thumbnail_url: data.publicUrl }));
    setUploadingImage(false);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `instructor/avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) { toast.error(error.message); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setForm((p) => ({ ...p, instructor_avatar: data.publicUrl }));
    setUploadingAvatar(false);
  };

  // Save course draft (creates course via server API to bypass RLS)
  const saveDraft = async () => {
    if (!form.title.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    if (!form.instructor_name.trim()) { toast.error("ইন্সট্রাক্টরের নাম দিন"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const slug = form.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");
    const payload = {
      title: form.title.trim(),
      slug,
      description: form.description.trim(),
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      duration_text: form.duration_text.trim(),
      duration_minutes: parseInt(form.duration_text) || 0,
      thumbnail_url: form.thumbnail_url,
      intro_video_url: form.intro_video_url.trim(),
      what_will_learn: form.what_will_learn.trim(),
      requirements: form.requirements.trim(),
      target_audience: form.target_audience.trim(),
      materials_included: form.materials_included.trim(),
      instructor_name: form.instructor_name.trim(),
      instructor_bio: form.instructor_bio.trim(),
      instructor_avatar: form.instructor_avatar,
      certificate_enabled: form.certificate_enabled,
      certificate_title: form.certificate_title.trim(),
      certificate_body: form.certificate_body.trim(),
      certificate_signature: form.certificate_signature.trim(),
    };

    const res = await fetch("/api/instructor-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: courseId ? "update" : "create",
        courseId,
        payload,
        instructorId: session.user.id,
      }),
    });
    const result = await res.json();
    if (!res.ok) { toast.error(result.error || "সেভ ব্যর্থ"); setSaving(false); return; }

    if (!courseId && result.id) {
      setCourseId(result.id);
      loadModules(result.id);
      toast.success("কোর্স তৈরি হয়েছে। এখন কারিকুলাম যোগ করুন।");
    } else {
      toast.success("ড্রাফট সেভ হয়েছে");
    }
    setSaving(false);
  };

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Submit for approval
  const submitForApproval = async () => {
    if (!courseId) { toast.error("আগে কোর্স সেভ করুন"); return; }
    if (!form.title.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    if (!form.description.trim()) { toast.error("বিবরণ দিন"); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error("মূল্য দিন"); return; }
    if (!form.duration_text.trim()) { toast.error("সময়কাল দিন"); return; }
    if (!form.thumbnail_url) { toast.error("কভার ইমেজ আপলোড করুন"); return; }
    if (!form.what_will_learn.trim()) { toast.error("কী শিখবেন তথ্য দিন"); return; }
    if (!form.certificate_title.trim()) { toast.error("সার্টিফিকেট শিরোনাম দিন"); return; }
    if (!form.certificate_body.trim()) { toast.error("সার্টিফিকেট বডি টেক্সট দিন"); return; }
    if (!form.certificate_signature.trim()) { toast.error("স্বাক্ষর দিন"); return; }
    if (!form.instructor_name.trim() || !form.instructor_bio.trim() || !form.instructor_avatar) {
      toast.error("ইন্সট্রাক্টর নাম, পরিচিতি ও ছবি আবশ্যক"); return;
    }
    if (modules.length === 0) { toast.error("কমপক্ষে একটি কারিকুলাম টপিক যোগ করুন"); return; }

    // Show confirmation popup
    setShowConfirmPopup(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmPopup(false);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/instructor-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", courseId }),
    });

    await fetch("/api/notify-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "নতুন কোর্স সাবমিশন",
        message: `"${form.title}" কোর্স রিভিউ ও পাবলিশের জন্য জমা দেওয়া হয়েছে।`,
        type: "instructor",
        link: "/admin/instructor-courses",
        userId: session.user.id,
        userTitle: "কোর্স সাবমিট হয়েছে",
        userMessage: `"${form.title}" অ্যাডমিন রিভিউ করছেন।`,
        userLink: "/instructor",
      }),
    });
    toast.success("কোর্স অ্যাপ্রুভালের জন্য সাবমিট হয়েছে!");
    setSaving(false);
    router.push("/instructor");
  };

  // Curriculum helpers
  const loadModules = async (id: string) => {
    const { data } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", id).order("sort_order");
    setModules(data ?? []);
  };
  const toggleModule = (id: string) => setExpandedModules((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const saveTopicDraft = async () => {
    if (!courseId || !topicDraft?.title.trim()) return;
    await supabase.from("modules").insert({ course_id: courseId, title: topicDraft.title.trim(), summary: topicDraft.summary.trim() || null, sort_order: modules.length });
    setTopicDraft(null);
    loadModules(courseId);
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("এই টপিক ডিলিট করবেন?")) return;
    await supabase.from("lessons").delete().in("module_id", [moduleId]);
    await supabase.from("modules").delete().eq("id", moduleId);
    if (courseId) loadModules(courseId);
  };

  const saveLessonDraft = async () => {
    if (!lessonDraft?.title.trim()) return;
    const mod = modules.find((m) => m.id === lessonDraft.moduleId);
    await supabase.from("lessons").insert({
      module_id: lessonDraft.moduleId, title: lessonDraft.title.trim(),
      video_url: lessonDraft.videoUrl.trim() || null, duration_minutes: parseInt(lessonDraft.duration) || 0,
      lesson_type: "lesson", sort_order: mod?.lessons?.length ?? 0,
    });
    setLessonDraft(null);
    if (courseId) loadModules(courseId);
  };

  const saveQuizDraft = async () => {
    if (!quizDraft?.title.trim()) return;
    const mod = modules.find((m) => m.id === quizDraft.moduleId);
    await supabase.from("lessons").insert({
      module_id: quizDraft.moduleId, title: quizDraft.title.trim(),
      lesson_type: "quiz", sort_order: mod?.lessons?.length ?? 0,
    });
    setQuizDraft(null);
    if (courseId) loadModules(courseId);
  };

  const deleteLesson = async (lessonId: string) => {
    await supabase.from("lessons").delete().eq("id", lessonId);
    if (courseId) loadModules(courseId);
    if (editingQuizId === lessonId) setEditingQuizId(null);
  };

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
    await supabase.from("quiz_questions").insert({
      lesson_id: editingQuizId, question: newQuestion.question.trim(),
      options: filledOptions, correct_answer: newQuestion.correct_answer, sort_order: quizQuestions.length,
    });
    setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 });
    const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order");
    setQuizQuestions(data ?? []);
    toast.success("প্রশ্ন যোগ হয়েছে");
  };

  const deleteQuestion = async (qId: string) => {
    if (!editingQuizId) return;
    await supabase.from("quiz_questions").delete().eq("id", qId);
    const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order");
    setQuizQuestions(data ?? []);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">নতুন কোর্স তৈরি করুন</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}ড্রাফট সেভ
          </Button>
          {courseId && (
            <Button onClick={submitForApproval} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              <Send className="mr-1 h-4 w-4" />অ্যাপ্রুভালে পাঠান
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left */}
        <div className="space-y-5">
          {/* Basic Info */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">বেসিক তথ্য</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div><Label>কোর্সের নাম *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="কোর্সের নাম" /></div>
              <div><Label>বিবরণ *</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="কোর্সের বিবরণ" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>মূল্য (৳) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>পূর্বের মূল্য (৳)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="ঐচ্ছিক" /></div>
              </div>
              <div><Label>সময়কাল (মিনিট) *</Label>
                <div className="relative mt-1.5">
                  <Input type="number" min="1" value={form.duration_text} onChange={(e) => setForm({ ...form, duration_text: e.target.value })} placeholder="যেমন: 120" className="pr-14" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">মিনিট</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Info */}
          <Card className="border-purple-200">
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-purple-700 uppercase">ইন্সট্রাক্টর তথ্য (আবশ্যক)</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div><Label>নাম *</Label><Input value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} placeholder="আপনার নাম" /></div>
              <div><Label>পরিচিতি *</Label><Textarea rows={2} value={form.instructor_bio} onChange={(e) => setForm({ ...form, instructor_bio: e.target.value })} placeholder="আপনার সম্পর্কে" /></div>
              <div>
                <Label>ছবি *</Label>
                <Input type="file" accept="image/*" disabled={uploadingAvatar} onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                {form.instructor_avatar && <p className="mt-1 text-xs text-green-600">✓ আপলোড হয়েছে</p>}
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">ওভারভিউ</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div><Label>কী শিখবেন (প্রতি লাইনে একটি) *</Label><Textarea rows={3} value={form.what_will_learn} onChange={(e) => setForm({ ...form, what_will_learn: e.target.value })} /></div>
              <div><Label>উপকরণ (Materials Included)</Label><Textarea rows={2} value={form.materials_included} onChange={(e) => setForm({ ...form, materials_included: e.target.value })} placeholder="কী কী উপকরণ পাবেন" /></div>
            </CardContent>
          </Card>

          {/* Certificate */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">সার্টিফিকেট</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div><Label>সার্টিফিকেট শিরোনাম *</Label><Input value={form.certificate_title} onChange={(e) => setForm({ ...form, certificate_title: e.target.value })} placeholder="কোর্স সমাপ্তি সার্টিফিকেট" /></div>
              <div><Label>বডি টেক্সট *</Label><Textarea rows={2} value={form.certificate_body} onChange={(e) => setForm({ ...form, certificate_body: e.target.value })} placeholder="সফলভাবে কোর্সটি সম্পন্ন করার জন্য" /></div>
              <div><Label>স্বাক্ষর *</Label><Input value={form.certificate_signature} onChange={(e) => setForm({ ...form, certificate_signature: e.target.value })} placeholder="Engr. Name, Designation" /></div>
              {/* Live Preview */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">লাইভ প্রিভিউ</p>
                <div className="overflow-hidden rounded-lg border">
                  <Certificate
                    studentName="শিক্ষার্থীর নাম"
                    courseName={form.title || "কোর্সের নাম"}
                    certificateNumber="CERT-PREVIEW"
                    issuedDate={new Date().toLocaleDateString("bn-BD")}
                    siteName="Zero Space Architect"
                    title={form.certificate_title}
                    body={form.certificate_body}
                    signature={form.certificate_signature}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Curriculum */}
          {courseId ? (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">কারিকুলাম</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                {modules.map((mod) => (
                  <div key={mod.id} className="rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <button className="flex flex-1 items-center gap-2 text-left font-medium text-sm" onClick={() => toggleModule(mod.id)}>
                        {expandedModules.has(mod.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {mod.title}
                        <span className="ml-auto text-xs text-muted-foreground">{mod.lessons?.length ?? 0} লেসন</span>
                      </button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteModule(mod.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    {expandedModules.has(mod.id) && (
                      <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                        {mod.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                          <div key={lesson.id}>
                            <div className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                {lesson.lesson_type === "quiz" ? <HelpCircle className="h-3.5 w-3.5 text-purple-500" /> : <Video className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span>{lesson.title}</span>
                                {lesson.duration_minutes > 0 && <span className="text-xs text-muted-foreground">({lesson.duration_minutes} মি)</span>}
                              </div>
                              <div className="flex items-center gap-1">
                                {lesson.lesson_type === "quiz" && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs text-purple-600" onClick={() => openQuizEditor(lesson.id)}>
                                    {editingQuizId === lesson.id ? "বন্ধ" : "প্রশ্ন"}
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                            {/* Quiz questions editor */}
                            {lesson.lesson_type === "quiz" && editingQuizId === lesson.id && (
                              <div className="ml-4 mt-2 mb-2 space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-purple-700">কুইজ প্রশ্ন ({quizQuestions.length} টি)</p>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingQuizId(null)}>
                                    <X className="mr-1 h-3 w-3" />বন্ধ করুন
                                  </Button>
                                </div>
                                {quizQuestions.map((q, qi) => (
                                  <div key={q.id} className="flex items-start justify-between gap-2 rounded border bg-background p-2 text-xs">
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
                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                ))}
                                <div className="space-y-2 rounded border bg-background p-2">
                                  <Input placeholder="প্রশ্ন লিখুন" value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} className="text-sm" />
                                  {newQuestion.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input type="radio" name="correct" checked={newQuestion.correct_answer === i} onChange={() => setNewQuestion({ ...newQuestion, correct_answer: i })} />
                                      <Input placeholder={`অপশন ${i + 1}`} value={opt} onChange={(e) => { const opts = [...newQuestion.options]; opts[i] = e.target.value; setNewQuestion({ ...newQuestion, options: opts }); }} className="text-sm" />
                                    </div>
                                  ))}
                                  <p className="text-[10px] text-muted-foreground">রেডিও দিয়ে সঠিক উত্তর নির্বাচন করুন</p>
                                  <Button size="sm" onClick={addQuestion}><Plus className="mr-1 h-3 w-3" />প্রশ্ন যোগ করুন</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {lessonDraft?.moduleId === mod.id ? (
                          <div className="space-y-2 rounded border bg-background p-2">
                            <Input placeholder="লেসনের নাম" value={lessonDraft.title} onChange={(e) => setLessonDraft((d) => d && { ...d, title: e.target.value })} />
                            <Input placeholder="ভিডিও URL" value={lessonDraft.videoUrl} onChange={(e) => setLessonDraft((d) => d && { ...d, videoUrl: e.target.value })} />
                            <Input type="number" placeholder="মিনিট" value={lessonDraft.duration} onChange={(e) => setLessonDraft((d) => d && { ...d, duration: e.target.value })} />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setLessonDraft(null)}>বাতিল</Button>
                              <Button size="sm" onClick={saveLessonDraft}>যোগ করুন</Button>
                            </div>
                          </div>
                        ) : quizDraft?.moduleId === mod.id ? (
                          <div className="space-y-2 rounded border bg-background p-2">
                            <Input placeholder="কুইজের নাম" value={quizDraft.title} onChange={(e) => setQuizDraft((d) => d && { ...d, title: e.target.value })} />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setQuizDraft(null)}>বাতিল</Button>
                              <Button size="sm" onClick={saveQuizDraft}>যোগ করুন</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setLessonDraft({ moduleId: mod.id, title: "", videoUrl: "", duration: "" }); setQuizDraft(null); }}>
                              <Plus className="mr-1 h-3 w-3" />লেসন
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setQuizDraft({ moduleId: mod.id, title: "" }); setLessonDraft(null); }}>
                              <Plus className="mr-1 h-3 w-3" />কুইজ
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {topicDraft ? (
                  <div className="space-y-2 rounded-lg border-2 border-purple-200 p-3">
                    <Input placeholder="টপিকের নাম" value={topicDraft.title} onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })} autoFocus />
                    <Textarea rows={2} placeholder="সারসংক্ষেপ" value={topicDraft.summary} onChange={(e) => setTopicDraft({ ...topicDraft, summary: e.target.value })} />
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                প্রথমে "ড্রাফট সেভ" করুন, তারপর কারিকুলাম যোগ করতে পারবেন।
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">কভার ইমেজ *</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              {form.thumbnail_url ? (
                <div className="relative">
                  <Image src={form.thumbnail_url} alt="" width={300} height={160} className="h-40 w-full rounded object-cover" />
                  <Button size="sm" variant="destructive" className="absolute right-2 top-2 h-7 w-7 p-0" onClick={() => setForm({ ...form, thumbnail_url: "" })}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-8 text-sm hover:bg-muted">
                  {uploadingImage ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                  <span className="text-muted-foreground">{uploadingImage ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">ইন্ট্রো ভিডিও</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <Input placeholder="YouTube / Vimeo URL" value={form.intro_video_url} onChange={(e) => setForm({ ...form, intro_video_url: e.target.value })} />
            </CardContent>
          </Card>

          {/* Submit for approval */}
          {courseId && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="mb-3 text-xs text-purple-700">সব তথ্য ও কারিকুলাম যোগ করে সাবমিট করুন</p>
                <Button onClick={submitForApproval} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Send className="mr-1 h-4 w-4" />অ্যাপ্রুভালে পাঠান
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-center text-white">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold">গুরুত্বপূর্ণ সতর্কতা!</h3>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-3 text-sm text-gray-700">
                <p className="font-medium text-red-600">
                  ❌ একবার অ্যাপ্রুভ হয়ে গেলে আপনি আর কোর্সে কোনো পরিবর্তন করতে পারবেন না।
                </p>
                <p>
                  ✅ অনুগ্রহ করে সব তথ্য, কারিকুলাম, ভিডিও লিংক ও সার্টিফিকেট তথ্য ভালোভাবে যাচাই করুন।
                </p>
                <p className="font-semibold text-gray-900">
                  আপনি কি নিশ্চিত যে সাবমিট করতে চান?
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={confirmSubmit} disabled={saving}>
                  {saving ? "সাবমিট হচ্ছে..." : "হ্যাঁ, সাবমিট করুন"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmPopup(false)}>
                  বাতিল
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
