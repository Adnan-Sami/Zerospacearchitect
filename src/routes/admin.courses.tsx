import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Check, Upload, Loader2, ImageIcon, Video, ArrowLeft, Eye, EyeOff, GripVertical, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

type Step = 1 | 2 | 3;

function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  // Curriculum inline editor state
  const [topicDraft, setTopicDraft] = useState<{ title: string; summary: string } | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicEdit, setTopicEdit] = useState<{ title: string; summary: string }>({ title: "", summary: "" });
  const [lessonDraft, setLessonDraft] = useState<{ moduleId: string; title: string; videoUrl: string; duration: string } | null>(null);
  const [quizDraft, setQuizDraft] = useState<{ moduleId: string; title: string } | null>(null);

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

  const persistCourse = async (proceedTo?: Step) => {
    if (!editingCourse.title?.trim()) { toast.error("কোর্সের নাম দিন"); return; }
    const slug = editingCourse.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-\u0980-\u09FF]/g, "");
    const courseData: any = { ...editingCourse, slug };
    delete courseData.categories;
    if (!courseData.category_id) courseData.category_id = null;

    let courseId = savedCourseId ?? editingCourse.id;
    if (isNew && !savedCourseId) {
      delete courseData.id;
      const { data, error } = await supabase.from("courses").insert(courseData).select().single();
      if (error) { toast.error(error.message); return; }
      courseId = data.id;
      setSavedCourseId(courseId);
      setEditingCourse({ ...editingCourse, id: courseId });
    } else {
      const { error } = await supabase.from("courses").update(courseData).eq("id", courseId);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("সেভ হয়েছে");
    loadCourses();
    if (proceedTo && courseId) {
      if (proceedTo === 2) await loadModules(courseId);
      setStep(proceedTo);
    }
  };

  const closeBuilder = () => {
    setBuilderOpen(false); setStep(1); setSavedCourseId(null); setEditingCourse(null); setModules([]);
  };

  const openNew = () => {
    setEditingCourse({ title: "", description: "", thumbnail_url: "", intro_video_url: "", price: 0, original_price: null, duration_text: "", enrollment_count: 0, category_id: "", instructor_name: "", instructor_bio: "", is_published: false });
    setIsNew(true); setSavedCourseId(null); setStep(1); setBuilderOpen(true);
  };
  const openEdit = (course: any) => {
    setEditingCourse(course); setIsNew(false); setSavedCourseId(course.id); setStep(1); setBuilderOpen(true);
  };
  const openCurriculum = async (course: any) => {
    setEditingCourse(course); setIsNew(false); setSavedCourseId(course.id); await loadModules(course.id); setStep(2); setBuilderOpen(true);
  };

  const deleteCourse = async (id: string) => {
    if (confirm("এই কোর্সটি ডিলিট করতে চান?")) { await supabase.from("courses").delete().eq("id", id); loadCourses(); }
  };

  const saveTopicDraft = async () => {
    const id = savedCourseId ?? editingCourse?.id; if (!id || !topicDraft) return;
    if (!topicDraft.title.trim()) { toast.error("টপিকের নাম দিন"); return; }
    const { error } = await supabase.from("modules").insert({ course_id: id, title: topicDraft.title.trim(), summary: topicDraft.summary.trim() || null, sort_order: modules.length });
    if (error) { toast.error(error.message); return; }
    setTopicDraft(null);
    loadModules(id);
  };
  const updateTopic = async (moduleId: string) => {
    if (!topicEdit.title.trim()) { toast.error("টপিকের নাম দিন"); return; }
    const { error } = await supabase.from("modules").update({ title: topicEdit.title.trim(), summary: topicEdit.summary.trim() || null }).eq("id", moduleId);
    if (error) { toast.error(error.message); return; }
    setEditingTopicId(null);
    const id = savedCourseId ?? editingCourse?.id; if (id) loadModules(id);
  };
  const saveLessonDraft = async () => {
    if (!lessonDraft) return;
    if (!lessonDraft.title.trim()) { toast.error("লেসনের নাম দিন"); return; }
    const mod = modules.find(m => m.id === lessonDraft.moduleId);
    const { error } = await supabase.from("lessons").insert({
      module_id: lessonDraft.moduleId,
      title: lessonDraft.title.trim(),
      video_url: lessonDraft.videoUrl.trim() || null,
      duration_minutes: parseInt(lessonDraft.duration) || 0,
      lesson_type: "lesson",
      sort_order: mod?.lessons?.length ?? 0,
    });
    if (error) { toast.error(error.message); return; }
    setLessonDraft(null);
    const id = savedCourseId ?? editingCourse?.id; if (id) loadModules(id);
  };
  const saveQuizDraft = async () => {
    if (!quizDraft) return;
    if (!quizDraft.title.trim()) { toast.error("কুইজের নাম দিন"); return; }
    const mod = modules.find(m => m.id === quizDraft.moduleId);
    const { error } = await supabase.from("lessons").insert({
      module_id: quizDraft.moduleId,
      title: quizDraft.title.trim(),
      lesson_type: "quiz",
      sort_order: mod?.lessons?.length ?? 0,
    });
    if (error) { toast.error(error.message); return; }
    setQuizDraft(null);
    const id = savedCourseId ?? editingCourse?.id; if (id) loadModules(id);
  };
  const deleteLesson = async (lessonId: string) => {
    await supabase.from("lessons").delete().eq("id", lessonId);
    const id = savedCourseId ?? editingCourse?.id; if (id) loadModules(id);
  };
  const deleteModule = async (moduleId: string) => {
    if (!confirm("এই টপিকটি ডিলিট করতে চান?")) return;
    await supabase.from("modules").delete().eq("id", moduleId);
    const id = savedCourseId ?? editingCourse?.id; if (id) loadModules(id);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("শুধু ইমেজ ফাইল আপলোড করুন"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("ইমেজ সাইজ ৫MB এর কম হতে হবে"); return; }
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(fileName, file);
    if (error) { toast.error(error.message); setUploadingImage(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(fileName);
    setEditingCourse((prev: any) => ({ ...prev, thumbnail_url: data.publicUrl }));
    toast.success("ইমেজ আপলোড হয়েছে"); setUploadingImage(false);
  };

  const addCategory = async () => {
    const name = newCategoryName.trim(); if (!name) { toast.error("ক্যাটেগরির নাম দিন"); return; }
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-\u0980-\u09FF]/g, "");
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) { toast.error(error.message); return; }
    toast.success("যোগ হয়েছে"); setNewCategoryName(""); loadCategories();
  };
  const deleteCategory = async (id: string) => {
    if (!confirm("ডিলিট করতে চান?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories(); loadCourses();
  };

  // ============== LIST VIEW ==============
  if (!builderOpen) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">কোর্স ম্যানেজমেন্ট</h1>
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />নতুন কোর্স</Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="py-3"><CardTitle className="text-base">কোর্স ক্যাটেগরি</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="নতুন ক্যাটেগরির নাম" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <Button onClick={addCategory} size="sm"><Plus className="mr-1 h-4 w-4" />যোগ করুন</Button>
            </div>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm">
                    <span>{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="ml-1 text-destructive hover:opacity-70"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">কোনো ক্যাটেগরি নেই</p>}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-20 overflow-hidden rounded bg-muted">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">৳{Number(course.price)} · {course.is_published ? "✅ পাবলিশড" : "🔒 ড্রাফট"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openCurriculum(course)}>কারিকুলাম</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(course)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteCourse(course.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && <p className="py-8 text-center text-muted-foreground">কোনো কোর্স নেই</p>}
        </div>
      </div>
    );
  }

  // ============== BUILDER VIEW ==============
  const filteredCats = categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const StepBtn = ({ n, label }: { n: Step; label: string }) => (
    <button onClick={() => n === 2 ? persistCourse(2) : setStep(n)} className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === n ? "bg-primary text-primary-foreground" : step > n ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
        {step > n ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <span className={`text-sm ${step === n ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );

  return (
    <div className="-mx-4 -my-4 md:-mx-6 md:-my-6">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={closeBuilder}><ArrowLeft className="mr-1 h-4 w-4" />ফিরে যান</Button>
            <span className="text-base font-semibold">Course Builder</span>
            <span className="text-muted-foreground">|</span>
            <div className="hidden items-center gap-4 md:flex">
              <StepBtn n={1} label="Basics" />
              <span className="h-px w-6 bg-border" />
              <StepBtn n={2} label="Curriculum" />
              <span className="h-px w-6 bg-border" />
              <StepBtn n={3} label="Additional" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => persistCourse()}><Save className="mr-1 h-4 w-4" />ড্রাফট সেভ</Button>
            <Button size="sm" onClick={async () => { setEditingCourse({ ...editingCourse, is_published: true }); await persistCourse(); toast.success("পাবলিশড"); }}>পাবলিশ</Button>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t px-4 py-2 md:hidden">
          <StepBtn n={1} label="Basics" />
          <StepBtn n={2} label="Curriculum" />
          <StepBtn n={3} label="Additional" />
        </div>
      </div>

      {editingCourse && (
        <div className="grid gap-6 p-4 md:grid-cols-[1fr_320px] md:p-6">
          {/* MAIN */}
          <div className="space-y-6">
            {step === 1 && (
              <>
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div>
                      <Label className="mb-1.5 block">Title</Label>
                      <Input placeholder="কোর্সের নাম" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} />
                      {editingCourse.title && <p className="mt-1.5 text-xs text-muted-foreground">Course URL: /courses/{editingCourse.title.toLowerCase().replace(/\s+/g, "-")}</p>}
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Description</Label>
                      <Textarea rows={8} placeholder="কোর্সের বিস্তারিত বিবরণ লিখুন..." value={editingCourse.description} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-base">Options</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="general">
                      <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="instructor">Instructor</TabsTrigger>
                      </TabsList>
                      <TabsContent value="general" className="space-y-4 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="mb-1.5 block">সময়কাল</Label>
                            <Input placeholder="40 Hours / 2 Month" value={editingCourse.duration_text ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, duration_text: e.target.value })} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block">এনরোলমেন্ট সংখ্যা</Label>
                            <Input type="number" value={editingCourse.enrollment_count ?? 0} onChange={(e) => setEditingCourse({ ...editingCourse, enrollment_count: Number(e.target.value) })} />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="instructor" className="space-y-4 pt-4">
                        <div>
                          <Label className="mb-1.5 block">ইন্সট্রাক্টরের নাম</Label>
                          <Input value={editingCourse.instructor_name} onChange={(e) => setEditingCourse({ ...editingCourse, instructor_name: e.target.value })} />
                        </div>
                        <div>
                          <Label className="mb-1.5 block">ইন্সট্রাক্টর সম্পর্কে</Label>
                          <Textarea rows={3} value={editingCourse.instructor_bio} onChange={(e) => setEditingCourse({ ...editingCourse, instructor_bio: e.target.value })} />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button>
                  <h2 className="text-xl font-semibold">Curriculum</h2>
                </div>

                {modules.map((mod) => (
                  <div key={mod.id} className="rounded-lg border-2 border-primary/30 bg-card p-4">
                    {editingTopicId === mod.id ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Add a title" value={topicEdit.title} onChange={(e) => setTopicEdit({ ...topicEdit, title: e.target.value })} className="bg-muted/40" />
                        </div>
                        <Textarea placeholder="Add a summary" rows={3} value={topicEdit.summary} onChange={(e) => setTopicEdit({ ...topicEdit, summary: e.target.value })} className="ml-6 bg-muted/40" />
                        <div className="flex justify-end gap-3 pr-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingTopicId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => updateTopic(mod.id)}>Ok</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <GripVertical className="mt-1 h-4 w-4 text-muted-foreground cursor-grab" />
                            <div className="flex-1">
                              <h3 className="font-semibold">{mod.title}</h3>
                              {mod.summary && <p className="mt-1 text-sm text-muted-foreground">{mod.summary}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTopicId(mod.id); setTopicEdit({ title: mod.title, summary: mod.summary ?? "" }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteModule(mod.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lessons inside topic */}
                    {mod.lessons && mod.lessons.length > 0 && (
                      <div className="mt-3 ml-6 space-y-1">
                        {mod.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between rounded border bg-muted/20 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              {lesson.lesson_type === "quiz" ? <HelpCircle className="h-3.5 w-3.5 text-primary" /> : <Video className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span>{lesson.title}</span>
                              {lesson.duration_minutes > 0 && <span className="text-xs text-muted-foreground">({lesson.duration_minutes} min)</span>}
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lesson draft */}
                    {lessonDraft && lessonDraft.moduleId === mod.id && (
                      <div className="mt-3 ml-6 space-y-2 rounded border bg-muted/20 p-3">
                        <Input placeholder="লেসনের নাম" value={lessonDraft.title} onChange={(e) => setLessonDraft((d) => d && { ...d, title: e.target.value })} />
                        <Input placeholder="ভিডিও URL (YouTube/Vimeo)" value={lessonDraft.videoUrl} onChange={(e) => setLessonDraft((d) => d && { ...d, videoUrl: e.target.value })} />
                        <Input type="number" placeholder="সময়কাল (মিনিট)" value={lessonDraft.duration} onChange={(e) => setLessonDraft((d) => d && { ...d, duration: e.target.value })} />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setLessonDraft(null)}>Cancel</Button>
                          <Button size="sm" onClick={saveLessonDraft}>Ok</Button>
                        </div>
                      </div>
                    )}

                    {/* Quiz draft */}
                    {quizDraft && quizDraft.moduleId === mod.id && (
                      <div className="mt-3 ml-6 space-y-2 rounded border bg-muted/20 p-3">
                        <Input placeholder="কুইজের নাম" value={quizDraft.title} onChange={(e) => setQuizDraft((d) => d && { ...d, title: e.target.value })} />
                        <p className="text-xs text-muted-foreground">কুইজ তৈরির পর প্রশ্ন যোগ করতে পারবেন</p>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setQuizDraft(null)}>Cancel</Button>
                          <Button size="sm" onClick={saveQuizDraft}>Ok</Button>
                        </div>
                      </div>
                    )}

                    {/* Lesson / Quiz buttons */}
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setLessonDraft({ moduleId: mod.id, title: "", videoUrl: "", duration: "" }); setQuizDraft(null); }}>
                        <Plus className="mr-1 h-3.5 w-3.5" />Lesson
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setQuizDraft({ moduleId: mod.id, title: "" }); setLessonDraft(null); }}>
                        <Plus className="mr-1 h-3.5 w-3.5" />Quiz
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Topic draft */}
                {topicDraft && (
                  <div className="rounded-lg border-2 border-primary/40 bg-card p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Add a title" value={topicDraft.title} onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })} className="bg-muted/40" autoFocus />
                    </div>
                    <Textarea placeholder="Add a summary" rows={3} value={topicDraft.summary} onChange={(e) => setTopicDraft({ ...topicDraft, summary: e.target.value })} className="ml-6 bg-muted/40" />
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setTopicDraft(null)}>Cancel</Button>
                      <Button size="sm" onClick={saveTopicDraft}>Ok</Button>
                    </div>
                  </div>
                )}

                {/* Add Topic */}
                {!topicDraft && (
                  <Button variant="outline" className="bg-primary/5 text-primary hover:bg-primary/10" onClick={() => setTopicDraft({ title: "", summary: "" })}>
                    <Plus className="mr-1 h-4 w-4" />Add Topic
                  </Button>
                )}

                {modules.length === 0 && !topicDraft && (
                  <p className="py-6 text-center text-muted-foreground">কোনো টপিক নেই। উপরের বাটনে যোগ করুন।</p>
                )}
              </div>
            )}

            {step === 3 && (
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">কোর্সের গুরুত্বপূর্ণ তথ্য দিন যা শিক্ষার্থীদের আকৃষ্ট করবে</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="mb-1.5 block">What Will I Learn?</Label>
                    <Textarea
                      rows={4}
                      placeholder="এই কোর্সের মূল শেখার বিষয়গুলো লিখুন (প্রতি লাইনে একটি)"
                      value={editingCourse.what_will_learn ?? ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, what_will_learn: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Target Audience</Label>
                    <Textarea
                      rows={3}
                      placeholder="যাদের জন্য এই কোর্স উপযুক্ত (প্রতি লাইনে একটি)"
                      value={editingCourse.target_audience ?? ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, target_audience: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Total Course Duration</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          value={editingCourse.duration_hours ?? 0}
                          onChange={(e) => setEditingCourse({ ...editingCourse, duration_hours: parseInt(e.target.value) || 0 })}
                          className="pr-20"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">hour(s)</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={editingCourse.duration_minutes ?? 0}
                          onChange={(e) => setEditingCourse({ ...editingCourse, duration_minutes: parseInt(e.target.value) || 0 })}
                          className="pr-20"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">min(s)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Materials Included</Label>
                    <Textarea
                      rows={4}
                      placeholder="শিক্ষার্থীদের জন্য আপনি যা সরবরাহ করবেন তার তালিকা (প্রতি লাইনে একটি)"
                      value={editingCourse.materials_included ?? ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, materials_included: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Requirements/Instructions</Label>
                    <Textarea
                      rows={4}
                      placeholder="অতিরিক্ত প্রয়োজনীয়তা বা বিশেষ নির্দেশনা (প্রতি লাইনে একটি)"
                      value={editingCourse.requirements ?? ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, requirements: e.target.value })}
                    />
                  </div>

                  <div className="border-t pt-5">
                    <Label className="mb-1.5 block">ইন্ট্রো ভিডিও URL (YouTube/Vimeo)</Label>
                    <Input placeholder="https://youtube.com/..." value={editingCourse.intro_video_url ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, intro_video_url: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">ইন্সট্রাক্টর বায়ো</Label>
                    <Textarea rows={4} value={editingCourse.instructor_bio ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, instructor_bio: e.target.value })} />
                  </div>

                  <div className="border-t pt-5">
                    <h3 className="mb-3 text-base font-semibold">🏆 সার্টিফিকেট সেটিংস</h3>
                    <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={editingCourse.certificate_enabled ?? true}
                        onCheckedChange={(v) => setEditingCourse({ ...editingCourse, certificate_enabled: !!v })}
                      />
                      <span>এই কোর্সের জন্য সার্টিফিকেট সক্রিয় করুন</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-1.5 block">সার্টিফিকেট শিরোনাম</Label>
                        <Input
                          placeholder="কোর্স সমাপ্তি সার্টিফিকেট"
                          value={editingCourse.certificate_title ?? ""}
                          onChange={(e) => setEditingCourse({ ...editingCourse, certificate_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">সার্টিফিকেট বডি টেক্সট</Label>
                        <Textarea
                          rows={3}
                          placeholder="সফলভাবে নিম্নলিখিত কোর্সটি সম্পন্ন করার জন্য:"
                          value={editingCourse.certificate_body ?? ""}
                          onChange={(e) => setEditingCourse({ ...editingCourse, certificate_body: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">স্বাক্ষর / অথরিটি (ঐচ্ছিক)</Label>
                        <Input
                          placeholder="পরিচালক, Zero Space Architect"
                          value={editingCourse.certificate_signature ?? ""}
                          onChange={(e) => setEditingCourse({ ...editingCourse, certificate_signature: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step nav */}
            <div className="flex justify-between">
              <Button variant="outline" disabled={step === 1} onClick={() => setStep((step - 1) as Step)}><ArrowLeft className="mr-1 h-4 w-4" />পূর্ববর্তী</Button>
              {step < 3 ? (
                <Button onClick={() => persistCourse((step + 1) as Step)}>পরবর্তী ধাপ</Button>
              ) : (
                <Button onClick={async () => { await persistCourse(); closeBuilder(); }}><Check className="mr-1 h-4 w-4" />সম্পন্ন</Button>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Label className="mb-1.5 block">Visibility</Label>
                <Select value={editingCourse.is_published ? "public" : "draft"} onValueChange={(v) => setEditingCourse({ ...editingCourse, is_published: v === "public" })}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {editingCourse.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {editingCourse.is_published ? "Public" : "Draft"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌐 Public — সবাই দেখতে পাবে</SelectItem>
                    <SelectItem value="draft">🔒 Draft — শুধু অ্যাডমিন</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("bn-BD")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Label className="mb-2 block">Featured Image</Label>
                {editingCourse.thumbnail_url ? (
                  <div className="relative">
                    <img src={editingCourse.thumbnail_url} alt="" className="h-36 w-full rounded object-cover" />
                    <Button size="sm" variant="destructive" className="absolute right-2 top-2 h-7 w-7 p-0" onClick={() => setEditingCourse({ ...editingCourse, thumbnail_url: "" })}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-6 text-sm hover:bg-muted">
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="rounded bg-primary/10 px-3 py-1 text-primary"><Upload className="mr-1 inline h-3 w-3" />Upload Thumbnail</span>}
                    <span className="text-xs text-muted-foreground">JPEG, PNG, WebP — সর্বোচ্চ ৫MB</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                )}
                <Input className="mt-2" placeholder="অথবা URL পেস্ট করুন" value={editingCourse.thumbnail_url} onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail_url: e.target.value })} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Label className="mb-2 block">Intro Video</Label>
                {editingCourse.intro_video_url ? (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs">
                    <p className="break-all">{editingCourse.intro_video_url}</p>
                    <Button size="sm" variant="ghost" className="mt-2 h-7" onClick={() => setEditingCourse({ ...editingCourse, intro_video_url: "" })}><X className="mr-1 h-3 w-3" />Remove</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-3 py-6">
                    <Video className="h-7 w-7 text-muted-foreground" />
                    <Button size="sm" variant="outline" onClick={() => {
                      const url = prompt("YouTube/Vimeo URL দিন:");
                      if (url) setEditingCourse({ ...editingCourse, intro_video_url: url });
                    }}><Plus className="mr-1 h-3 w-3" />Add from URL</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Label className="mb-2 block">Pricing Model</Label>
                <div className="mb-3 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" checked={Number(editingCourse.price) === 0} onChange={() => setEditingCourse({ ...editingCourse, price: 0, original_price: null })} />
                    Free
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" checked={Number(editingCourse.price) > 0} onChange={() => setEditingCourse({ ...editingCourse, price: editingCourse.price > 0 ? editingCourse.price : 500 })} />
                    Paid
                  </label>
                </div>
                {Number(editingCourse.price) > 0 && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">মূল্য (৳)</Label>
                      <Input type="number" value={editingCourse.price} onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label className="text-xs">পূর্বের মূল্য (কাটা দাগ)</Label>
                      <Input type="number" value={editingCourse.original_price ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, original_price: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Label className="mb-2 block">Categories</Label>
                <Input className="mb-2" placeholder="🔍 Search" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2">
                  {filteredCats.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
                      <Checkbox checked={editingCourse.category_id === c.id} onCheckedChange={(v) => setEditingCourse({ ...editingCourse, category_id: v ? c.id : "" })} />
                      <span>{c.name}</span>
                    </label>
                  ))}
                  {filteredCats.length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">কোনো ক্যাটেগরি নেই</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
