"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

export default function InstructorEditCourse({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  // Load existing course data
  useEffect(() => {
    const loadCourse = async () => {
      const { data } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (data) {
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: String(data.price || 0),
          original_price: data.original_price ? String(data.original_price) : "",
          duration_text: data.duration_text || "",
          thumbnail_url: data.thumbnail_url || "",
          intro_video_url: data.intro_video_url || "",
          what_will_learn: data.what_will_learn || "",
          requirements: data.requirements || "",
          target_audience: data.target_audience || "",
          materials_included: data.materials_included || "",
          instructor_name: data.instructor_name || "",
          instructor_bio: data.instructor_bio || "",
          instructor_avatar: data.instructor_avatar || "",
          certificate_enabled: data.certificate_enabled ?? true,
          certificate_title: data.certificate_title || "",
          certificate_body: data.certificate_body || "",
          certificate_signature: data.certificate_signature || "",
        });
      }
      loadModules(courseId);
      setLoading(false);
    };
    loadCourse();
  }, [courseId]);

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

  const saveDraft = async () => {
    if (!form.title.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    setSaving(true);
    const slug = form.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");
    const res = await fetch("/api/instructor-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update", courseId,
        payload: { title: form.title.trim(), slug, description: form.description.trim(), price: Number(form.price) || 0, original_price: form.original_price ? Number(form.original_price) : null, duration_text: form.duration_text.trim(), thumbnail_url: form.thumbnail_url, intro_video_url: form.intro_video_url.trim(), what_will_learn: form.what_will_learn.trim(), requirements: form.requirements.trim(), target_audience: form.target_audience.trim(), materials_included: form.materials_included.trim(), instructor_name: form.instructor_name.trim(), instructor_bio: form.instructor_bio.trim(), instructor_avatar: form.instructor_avatar, certificate_enabled: form.certificate_enabled, certificate_title: form.certificate_title.trim(), certificate_body: form.certificate_body.trim(), certificate_signature: form.certificate_signature.trim() },
      }),
    });
    if (!res.ok) { const r = await res.json(); toast.error(r.error); } else { toast.success("সেভ হয়েছে"); }
    setSaving(false);
  };

  const submitForApproval = async () => {
    if (!form.instructor_name.trim() || !form.instructor_avatar) { toast.error("ইন্সট্রাক্টর তথ্য আবশ্যক"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/instructor-course", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", courseId }) });
    await fetch("/api/notify-admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "কোর্স সাবমিশন", message: `"${form.title}" রিভিউর জন্য জমা দেওয়া হয়েছে।`, type: "instructor", link: "/admin/instructor-courses", userId: session?.user?.id, userTitle: "কোর্স সাবমিট হয়েছে", userMessage: `"${form.title}" রিভিউতে আছে।`, userLink: "/instructor" }) });
    toast.success("অ্যাপ্রুভালে পাঠানো হয়েছে!");
    setSaving(false);
    router.push("/instructor");
  };

  const loadModules = async (id: string) => { const { data } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", id).order("sort_order"); setModules(data ?? []); };
  const toggleModule = (id: string) => setExpandedModules((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const saveTopicDraft = async () => { if (!topicDraft?.title.trim()) return; await supabase.from("modules").insert({ course_id: courseId, title: topicDraft.title.trim(), summary: topicDraft.summary.trim() || null, sort_order: modules.length }); setTopicDraft(null); loadModules(courseId); };
  const deleteModule = async (id: string) => { if (!confirm("ডিলিট?")) return; await supabase.from("lessons").delete().in("module_id", [id]); await supabase.from("modules").delete().eq("id", id); loadModules(courseId); };
  const saveLessonDraft = async () => { if (!lessonDraft?.title.trim()) return; const mod = modules.find((m) => m.id === lessonDraft.moduleId); await supabase.from("lessons").insert({ module_id: lessonDraft.moduleId, title: lessonDraft.title.trim(), video_url: lessonDraft.videoUrl.trim() || null, duration_minutes: parseInt(lessonDraft.duration) || 0, lesson_type: "lesson", sort_order: mod?.lessons?.length ?? 0 }); setLessonDraft(null); loadModules(courseId); };
  const saveQuizDraft = async () => { if (!quizDraft?.title.trim()) return; const mod = modules.find((m) => m.id === quizDraft.moduleId); await supabase.from("lessons").insert({ module_id: quizDraft.moduleId, title: quizDraft.title.trim(), lesson_type: "quiz", sort_order: mod?.lessons?.length ?? 0 }); setQuizDraft(null); loadModules(courseId); };
  const deleteLesson = async (id: string) => { await supabase.from("lessons").delete().eq("id", id); loadModules(courseId); if (editingQuizId === id) setEditingQuizId(null); };
  const openQuizEditor = async (id: string) => { if (editingQuizId === id) { setEditingQuizId(null); return; } setEditingQuizId(id); const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", id).order("sort_order"); setQuizQuestions(data ?? []); setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 }); };
  const addQuestion = async () => { if (!editingQuizId || !newQuestion.question.trim()) return; const opts = newQuestion.options.filter(o => o.trim()); if (opts.length < 2) return; await supabase.from("quiz_questions").insert({ lesson_id: editingQuizId, question: newQuestion.question.trim(), options: opts, correct_answer: newQuestion.correct_answer, sort_order: quizQuestions.length }); setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 }); const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order"); setQuizQuestions(data ?? []); };
  const deleteQuestion = async (qId: string) => { if (!editingQuizId) return; await supabase.from("quiz_questions").delete().eq("id", qId); const { data } = await supabase.from("quiz_questions").select("*").eq("lesson_id", editingQuizId).order("sort_order"); setQuizQuestions(data ?? []); };

  if (loading) return <div className="py-20 text-center text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">কোর্স এডিট করুন</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}সেভ</Button>
          <Button onClick={submitForApproval} disabled={saving} className="bg-purple-600 hover:bg-purple-700"><Send className="mr-1 h-4 w-4" />অ্যাপ্রুভালে পাঠান</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">বেসিক তথ্য</CardTitle></CardHeader><CardContent className="space-y-4 pt-0">
            <div><Label>কোর্সের নাম *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>বিবরণ</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>মূল্য (৳)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div><Label>পূর্বের মূল্য</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div></div>
            <div><Label>সময়কাল</Label><Input value={form.duration_text} onChange={(e) => setForm({ ...form, duration_text: e.target.value })} /></div>
          </CardContent></Card>

          <Card className="border-purple-200"><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-purple-700 uppercase">ইন্সট্রাক্টর তথ্য</CardTitle></CardHeader><CardContent className="space-y-3 pt-0">
            <div><Label>নাম *</Label><Input value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} /></div>
            <div><Label>পরিচিতি *</Label><Textarea rows={2} value={form.instructor_bio || ""} onChange={(e) => setForm({ ...form, instructor_bio: e.target.value })} /></div>
            <div><Label>ছবি</Label><Input type="file" accept="image/*" disabled={uploadingAvatar} onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />{form.instructor_avatar && <p className="mt-1 text-xs text-green-600">✓ আপলোড আছে</p>}</div>
          </CardContent></Card>

          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">ওভারভিউ</CardTitle></CardHeader><CardContent className="space-y-3 pt-0">
            <div><Label>কী শিখবেন</Label><Textarea rows={3} value={form.what_will_learn} onChange={(e) => setForm({ ...form, what_will_learn: e.target.value })} /></div>
            <div><Label>পূর্বশর্ত</Label><Textarea rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div><Label>টার্গেট অডিয়েন্স</Label><Textarea rows={2} value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} /></div>
            <div><Label>উপকরণ</Label><Textarea rows={2} value={form.materials_included} onChange={(e) => setForm({ ...form, materials_included: e.target.value })} /></div>
          </CardContent></Card>

          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">সার্টিফিকেট</CardTitle></CardHeader><CardContent className="space-y-3 pt-0">
            <div><Label>শিরোনাম</Label><Input value={form.certificate_title} onChange={(e) => setForm({ ...form, certificate_title: e.target.value })} /></div>
            <div><Label>বডি</Label><Textarea rows={2} value={form.certificate_body} onChange={(e) => setForm({ ...form, certificate_body: e.target.value })} /></div>
            <div><Label>স্বাক্ষর</Label><Input value={form.certificate_signature} onChange={(e) => setForm({ ...form, certificate_signature: e.target.value })} /></div>
            <div><p className="mb-2 text-xs font-semibold text-muted-foreground">লাইভ প্রিভিউ</p><div className="overflow-hidden rounded-lg border"><Certificate studentName="শিক্ষার্থীর নাম" courseName={form.title || "কোর্সের নাম"} certificateNumber="CERT-PREVIEW" issuedDate={new Date().toLocaleDateString("bn-BD")} siteName="Zero Space Architect" title={form.certificate_title} body={form.certificate_body} signature={form.certificate_signature} /></div></div>
          </CardContent></Card>

          {/* Curriculum */}
          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">কারিকুলাম</CardTitle></CardHeader><CardContent className="pt-0 space-y-3">
            {modules.map((mod) => (
              <div key={mod.id} className="rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <button className="flex flex-1 items-center gap-2 text-left text-sm font-medium" onClick={() => toggleModule(mod.id)}>
                    {expandedModules.has(mod.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{mod.title}
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
                          </div>
                          <div className="flex items-center gap-1">
                            {lesson.lesson_type === "quiz" && <Button size="sm" variant="ghost" className="h-6 text-xs text-purple-600" onClick={() => openQuizEditor(lesson.id)}>{editingQuizId === lesson.id ? "বন্ধ" : "প্রশ্ন"}</Button>}
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        {lesson.lesson_type === "quiz" && editingQuizId === lesson.id && (
                          <div className="ml-4 mt-2 mb-2 space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
                            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-purple-700">প্রশ্ন ({quizQuestions.length})</p><Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingQuizId(null)}><X className="mr-1 h-3 w-3" />বন্ধ</Button></div>
                            {quizQuestions.map((q, qi) => (<div key={q.id} className="flex items-start justify-between rounded border bg-background p-2 text-xs"><div><p className="font-medium">{qi+1}. {q.question}</p>{(q.options||[]).map((o:string,i:number)=>(<p key={i} className={i===q.correct_answer?"text-green-600 font-semibold":"text-muted-foreground"}>{i===q.correct_answer?"✓ ":"• "}{o}</p>))}</div><Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={()=>deleteQuestion(q.id)}><Trash2 className="h-3 w-3"/></Button></div>))}
                            <div className="space-y-2 rounded border bg-background p-2">
                              <Input placeholder="প্রশ্ন" value={newQuestion.question} onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})} className="text-sm" />
                              {newQuestion.options.map((o,i)=>(<div key={i} className="flex items-center gap-2"><input type="radio" name="cq" checked={newQuestion.correct_answer===i} onChange={()=>setNewQuestion({...newQuestion,correct_answer:i})}/><Input value={o} onChange={(e)=>{const opts=[...newQuestion.options];opts[i]=e.target.value;setNewQuestion({...newQuestion,options:opts})}} className="text-sm" placeholder={`অপশন ${i+1}`}/></div>))}
                              <Button size="sm" onClick={addQuestion}><Plus className="mr-1 h-3 w-3"/>যোগ করুন</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {lessonDraft?.moduleId === mod.id ? (<div className="space-y-2 rounded border bg-background p-2"><Input placeholder="লেসনের নাম" value={lessonDraft.title} onChange={(e)=>setLessonDraft(d=>d&&{...d,title:e.target.value})}/><Input placeholder="ভিডিও URL" value={lessonDraft.videoUrl} onChange={(e)=>setLessonDraft(d=>d&&{...d,videoUrl:e.target.value})}/><Input type="number" placeholder="মিনিট" value={lessonDraft.duration} onChange={(e)=>setLessonDraft(d=>d&&{...d,duration:e.target.value})}/><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={()=>setLessonDraft(null)}>বাতিল</Button><Button size="sm" onClick={saveLessonDraft}>যোগ</Button></div></div>)
                    : quizDraft?.moduleId === mod.id ? (<div className="space-y-2 rounded border bg-background p-2"><Input placeholder="কুইজের নাম" value={quizDraft.title} onChange={(e)=>setQuizDraft(d=>d&&{...d,title:e.target.value})}/><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={()=>setQuizDraft(null)}>বাতিল</Button><Button size="sm" onClick={saveQuizDraft}>যোগ</Button></div></div>)
                    : (<div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>{setLessonDraft({moduleId:mod.id,title:"",videoUrl:"",duration:""});setQuizDraft(null)}}><Plus className="mr-1 h-3 w-3"/>লেসন</Button><Button variant="outline" size="sm" onClick={()=>{setQuizDraft({moduleId:mod.id,title:""});setLessonDraft(null)}}><Plus className="mr-1 h-3 w-3"/>কুইজ</Button></div>)}
                  </div>
                )}
              </div>
            ))}
            {topicDraft ? (<div className="space-y-2 rounded-lg border-2 border-purple-200 p-3"><Input placeholder="টপিকের নাম" value={topicDraft.title} onChange={(e)=>setTopicDraft({...topicDraft,title:e.target.value})} autoFocus/><Textarea rows={2} placeholder="সারসংক্ষেপ" value={topicDraft.summary} onChange={(e)=>setTopicDraft({...topicDraft,summary:e.target.value})}/><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={()=>setTopicDraft(null)}>বাতিল</Button><Button size="sm" onClick={saveTopicDraft}>যোগ</Button></div></div>)
            : (<Button variant="outline" onClick={()=>setTopicDraft({title:"",summary:""})}><Plus className="mr-1 h-4 w-4"/>নতুন টপিক</Button>)}
          </CardContent></Card>
        </div>

        <div className="space-y-4">
          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">কভার ইমেজ</CardTitle></CardHeader><CardContent className="pt-0 space-y-2">
            {form.thumbnail_url ? (<div className="relative"><Image src={form.thumbnail_url} alt="" width={300} height={160} className="h-40 w-full rounded object-cover"/><Button size="sm" variant="destructive" className="absolute right-2 top-2 h-7 w-7 p-0" onClick={()=>setForm({...form,thumbnail_url:""})}><X className="h-3 w-3"/></Button></div>)
            : (<label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-8 text-sm hover:bg-muted">{uploadingImage?<Loader2 className="h-6 w-6 animate-spin"/>:<ImageIcon className="h-6 w-6 text-muted-foreground"/>}<span className="text-muted-foreground">{uploadingImage?"আপলোড...":"ছবি আপলোড"}</span><input type="file" accept="image/*" className="hidden" onChange={(e)=>e.target.files?.[0]&&handleImageUpload(e.target.files[0])}/></label>)}
          </CardContent></Card>
          <Card><CardHeader className="py-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase">ইন্ট্রো ভিডিও</CardTitle></CardHeader><CardContent className="pt-0"><Input placeholder="YouTube URL" value={form.intro_video_url} onChange={(e)=>setForm({...form,intro_video_url:e.target.value})}/></CardContent></Card>
          <Card className="border-purple-200 bg-purple-50"><CardContent className="p-4 text-center"><p className="mb-3 text-xs text-purple-700">সব তথ্য দিয়ে সাবমিট করুন</p><Button onClick={submitForApproval} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700"><Send className="mr-1 h-4 w-4"/>অ্যাপ্রুভালে পাঠান</Button></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
