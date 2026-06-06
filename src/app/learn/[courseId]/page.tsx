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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
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
        router.push(`/courses/${courseId}`);
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      setCourse(courseData);

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`border-r bg-card transition-all ${
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          } hidden md:block`}
        >
          <div className="p-4">
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
                <div className="flex gap-2">
                  <Link href={`/quiz/${selectedLesson.id}`}>
                    <Button variant="outline" size="sm">
                      <HelpCircle className="mr-1 h-4 w-4" />কুইজ
                    </Button>
                  </Link>
                  <Button
                    variant={
                      progress.has(selectedLesson.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleComplete(selectedLesson.id)}
                  >
                    {progress.has(selectedLesson.id) ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />সম্পন্ন
                      </>
                    ) : (
                      "সম্পন্ন হিসেবে চিহ্নিত করুন"
                    )}
                  </Button>
                </div>
              </div>
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
