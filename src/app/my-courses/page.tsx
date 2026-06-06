"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("enrollments")
        .select(
          "*, courses(id, title, thumbnail_url, instructor_name, modules(id, lessons(id)))"
        )
        .eq("user_id", session.user.id);

      if (data) {
        const enriched = await Promise.all(
          data.map(async (enrollment) => {
            const allLessonIds =
              enrollment.courses?.modules?.flatMap(
                (m: any) => m.lessons?.map((l: any) => l.id) ?? []
              ) ?? [];
            if (allLessonIds.length === 0)
              return { ...enrollment, progress: 0 };
            const { data: progress } = await supabase
              .from("lesson_progress")
              .select("id")
              .eq("user_id", session.user.id)
              .eq("completed", true)
              .in("lesson_id", allLessonIds);
            return {
              ...enrollment,
              progress: Math.round(
                ((progress?.length ?? 0) / allLessonIds.length) * 100
              ),
            };
          })
        );
        setEnrollments(enriched);
      }
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">আমার কোর্সসমূহ</h1>
        {loading ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : enrollments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex gap-4 p-4">
                  <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {e.courses?.thumbnail_url ? (
                      <Image
                        src={e.courses.thumbnail_url}
                        alt=""
                        width={128}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{e.courses?.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {e.courses?.instructor_name}
                    </p>
                    <Progress value={e.progress} className="mb-2 h-2" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {e.progress}% সম্পন্ন
                      </span>
                      <div className="flex gap-2">
                        {e.progress === 100 && (
                          <Link
                            href={`/certificate/${e.courses?.id}`}
                          >
                            <Button size="sm" variant="default">
                              <Award className="mr-1 h-3 w-3" />সার্টিফিকেট
                            </Button>
                          </Link>
                        )}
                        <Link href={`/learn/${e.courses?.id}`}>
                          <Button size="sm" variant="outline">
                            চালিয়ে যান
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              আপনি এখনো কোনো কোর্সে এনরোল করেননি।
            </p>
            <Link href="/courses">
              <Button>কোর্স ব্রাউজ করুন</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
