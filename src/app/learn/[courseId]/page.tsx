"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Circle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { supabase } from "@/integrations/supabase/client";

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!enrollment) {
        // Check if they have a pending order
        const { data: pendingOrder } = await supabase
          .from("orders")
          .select("status")
          .eq("course_id", courseId)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingOrder?.status === "pending") {
          setCourse({ _pending: true });
        } else {
          router.push(`/courses/${courseId}`);
        }
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      
      // Even if course data fails to load (RLS), still show the learn page
      setCourse(courseData || { title: "কোর্স", id: courseId });

      const { data: modulesData } = await supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("sort_order");
      setModules(modulesData ?? []);

      if (modulesData?.[0]?.lessons?.length) {
        const sorted = [...modulesData[0].lessons].sort(
          (a, b) => a.sort_order - b.sort_order
        );
        setSelectedLesson(sorted[0]);
      }

      const allLessonIds =
        modulesData?.flatMap(
          (m) => m.lessons?.map((l: any) => l.id) ?? []
        ) ?? [];
      if (allLessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", session.user.id)
          .eq("completed", true)
          .in("lesson_id", allLessonIds);
        setProgress(new Set(progressData?.map((p) => p.lesson_id) ?? []));
      }
    });
  }, [courseId, router]);

  const toggleComplete = async (lessonId: string) => {
    const isCompleted = progress.has(lessonId);
    if (isCompleted) {
      await supabase
        .from("lesson_progress")
        .update({ completed: false, completed_at: null })
        .eq("user_id", userId)
        .eq("lesson_id", lessonId);
      setProgress((prev) => {
        const n = new Set(prev);
        n.delete(lessonId);
        return n;
      });
    } else {
      await supabase.from("lesson_progress").upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      setProgress((prev) => new Set(prev).add(lessonId));
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const totalLessons = modules.reduce(
    (s, m) => s + (m.lessons?.length ?? 0),
    0
  );
  const completedCount = progress.size;

  if (!course)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        লোড হচ্ছে...
      </div>
    );

  if (course._pending)
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">⏳</div>
          <h2 className="text-xl font-bold">অর্ডার পেন্ডিং আছে</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            আপনার অর্ডার অ্যাডমিন যাচাই করছেন। অ্যাপ্রুভ হলে কোর্সটি এখান থেকে শুরু করতে পারবেন।
          </p>
          <Link href="/dashboard">
            <Button variant="outline">ড্যাশবোর্ডে ফিরুন</Button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background relative z-10">
      <DashboardNavbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`border-r bg-card transition-all ${
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          } hidden md:block`}
        >
          <div className="p-4">
            <Link href="/dashboard" className="mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-accent">
              <LayoutDashboard className="h-4 w-4" />ড্যাশবোর্ড
            </Link>
            <h2 className="mb-1 text-sm font-bold">{course.title}</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {completedCount}/{totalLessons} সম্পন্ন
            </p>
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.id}>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    {mod.title}
                  </p>
                  {mod.lessons
                    ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((lesson: any) => (
                      <button
                        key={lesson.id}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          selectedLesson?.id === lesson.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        {progress.has(lesson.id) ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className="line-clamp-1 flex-1">
                          {lesson.title}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              লেসন তালিকা
            </Button>
          </div>

          {sidebarOpen && (
            <div className="border-b bg-card p-4 md:hidden">
              {modules.map((mod) => (
                <div key={mod.id} className="mb-2">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    {mod.title}
                  </p>
                  {mod.lessons
                    ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((lesson: any) => (
                      <button
                        key={lesson.id}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                          selectedLesson?.id === lesson.id
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setSidebarOpen(false);
                        }}
                      >
                        {progress.has(lesson.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="line-clamp-1">{lesson.title}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}

          {selectedLesson ? (
            <div className="p-4 md:p-6">
              {/* Video lesson */}
              {selectedLesson.lesson_type !== "quiz" && (
                <>
                  {selectedLesson.video_url && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-black">
                      <iframe
                        src={getEmbedUrl(selectedLesson.video_url)}
                        className="h-full w-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">{selectedLesson.title}</h2>
                    <Button
                      variant={progress.has(selectedLesson.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleComplete(selectedLesson.id)}
                    >
                      {progress.has(selectedLesson.id) ? (
                        <><CheckCircle className="mr-1 h-4 w-4" />সম্পন্ন</>
                      ) : (
                        "সম্পন্ন হিসেবে চিহ্নিত করুন"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Inline Quiz */}
              {selectedLesson.lesson_type === "quiz" && (
                <InlineQuiz
                  lessonId={selectedLesson.id}
                  lessonTitle={selectedLesson.title}
                  userId={userId}
                  onComplete={() => {
                    setProgress((prev) => new Set(prev).add(selectedLesson.id));
                  }}
                  isCompleted={progress.has(selectedLesson.id)}
                />
              )}

              {totalLessons > 0 && completedCount === totalLessons && (
                <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-4 text-center">
                  <p className="mb-2 font-semibold">
                    🎉 অভিনন্দন! আপনি কোর্সটি সম্পন্ন করেছেন।
                  </p>
                  <Link href={`/certificate/${courseId}`}>
                    <Button size="sm">সার্টিফিকেট ডাউনলোড করুন</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <PlayCircle className="mr-2 h-6 w-6" />একটি লেসন নির্বাচন করুন
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

/* ── Inline Quiz Component ── */
function InlineQuiz({
  lessonId,
  lessonTitle,
  userId,
  onComplete,
  isCompleted,
}: {
  lessonId: string;
  lessonTitle: string;
  userId: string;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      setRetaking(false);

      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("sort_order");
      setQuestions(qs ?? []);

      // If already completed, load the last attempt
      if (isCompleted) {
        const { data: attempt } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", userId)
          .eq("lesson_id", lessonId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (attempt) {
          setScore(attempt.score);
          setSubmitted(true);
          // Reconstruct answers from the attempt
          const savedAnswers: Record<string, number> = {};
          const attemptAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];
          attemptAnswers.forEach((a: any) => {
            if (a.question_id && a.selected !== undefined) {
              savedAnswers[a.question_id] = a.selected;
            }
          });
          setAnswers(savedAnswers);
        }
      } else {
        setSubmitted(false);
        setAnswers({});
        setScore(0);
      }

      setLoading(false);
    };
    loadQuiz();
  }, [lessonId, isCompleted, userId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;
    let s = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) s++;
    });
    setScore(s);
    setSubmitted(true);
    setRetaking(false);

    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      lesson_id: lessonId,
      score: s,
      total: questions.length,
      answers: questions.map((q) => ({ question_id: q.id, selected: answers[q.id] })),
    });

    await supabase.from("lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    onComplete();
  };

  const startRetake = () => {
    setRetaking(true);
    setSubmitted(false);
    setAnswers({});
    setScore(0);
  };

  if (loading) return <p className="py-8 text-center text-muted-foreground">কুইজ লোড হচ্ছে...</p>;

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center">
        <HelpCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-bold">{lessonTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">এই কুইজে কোনো প্রশ্ন নেই।</p>
        {isCompleted && <p className="mt-2 text-sm text-green-600">✓ সম্পন্ন</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">কুইজ: {lessonTitle}</h2>
          <p className="text-xs text-muted-foreground">মোট প্রশ্ন: {questions.length}</p>
        </div>
        {submitted && !retaking && (
          <Button size="sm" variant="outline" onClick={startRetake}>আবার দিন</Button>
        )}
      </div>

      {submitted && !retaking && (
        <Card className="mb-4 border-primary/40 bg-primary/5">
          <CardContent className="p-5 text-center">
            <h3 className="mb-1 text-base font-bold">আপনার স্কোর</h3>
            <p className="text-2xl font-bold text-primary">{score} / {questions.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {score === questions.length ? "চমৎকার! সব উত্তর সঠিক।" : score >= questions.length / 2 ? "ভালো করেছেন।" : "আবার চেষ্টা করুন।"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const opts = Array.isArray(q.options) ? q.options : [];
          const showResults = submitted && !retaking;
          return (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{qi + 1}. {q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pb-4">
                {opts.map((opt: string, i: number) => {
                  const selected = answers[q.id] === i;
                  const isCorrect = showResults && i === q.correct_answer;
                  const isWrong = showResults && selected && i !== q.correct_answer;
                  return (
                    <button
                      key={i}
                      disabled={showResults}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        isCorrect ? "border-green-500 bg-green-50" :
                        isWrong ? "border-red-500 bg-red-50" :
                        selected && !showResults ? "border-primary bg-primary/5" :
                        showResults ? "" :
                        "hover:bg-accent"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        isCorrect ? "border-green-500 bg-green-500 text-white" :
                        isWrong ? "border-red-500 bg-red-500 text-white" :
                        selected && !showResults ? "border-primary bg-primary text-white" :
                        "border-muted-foreground/30"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                      {isWrong && <Circle className="ml-auto h-4 w-4 text-red-500" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
        >
          উত্তর জমা দিন
        </Button>
      )}
    </div>
  );
}
