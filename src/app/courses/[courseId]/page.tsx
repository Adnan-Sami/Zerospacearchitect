"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { Star, Clock, BookOpen, PlayCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*, categories(name)")
        .eq("id", courseId)
        .eq("is_published", true)
        .single();
      setCourse(courseData);

      if (!courseData) { setLoading(false); return; }

      const [modulesRes, reviewsRes] = await Promise.all([
        supabase
          .from("modules")
          .select("*, lessons(*)")
          .eq("course_id", courseId)
          .order("sort_order"),
        supabase
          .from("reviews")
          .select("*, profiles(full_name)")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false }),
      ]);

      setModules(modulesRes.data ?? []);
      setReviews(reviewsRes.data ?? []);

      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("course_id", courseId)
          .eq("user_id", user.id)
          .maybeSingle();
        setEnrolled(!!enrollment);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId, user]);

  if (loading)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 py-20 text-center text-muted-foreground">
          লোড হচ্ছে...
        </div>
        <Footer />
      </div>
    );
  if (!course)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 py-20 text-center text-muted-foreground">
          কোর্স পাওয়া যায়নি।
        </div>
        <Footer />
      </div>
    );

  const totalLessons = modules.reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0
  );
  const totalDuration = modules.reduce(
    (sum, m) =>
      sum +
      (m.lessons?.reduce(
        (s: number, l: any) => s + (l.duration_minutes ?? 0),
        0
      ) ?? 0),
    0
  );
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              {course.categories?.name && (
                <Badge variant="secondary" className="mb-2">
                  {course.categories.name}
                </Badge>
              )}
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {course.title}
              </h1>
              <p className="mt-2 text-muted-foreground">{course.instructor_name}</p>
            </div>

            {course.thumbnail_url && (
              <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-muted">
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {totalLessons} টি লেসন
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalDuration} মিনিট
              </span>
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avgRating.toFixed(1)} ({reviews.length} রিভিউ)
                </span>
              )}
            </div>

            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">বিবরণ</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {course.description || "বিবরণ শীঘ্রই আসছে..."}
              </p>
            </div>

            {course.instructor_bio && (
              <div className="mb-8">
                <h2 className="mb-2 text-lg font-semibold">ইন্সট্রাক্টর সম্পর্কে</h2>
                <p className="text-muted-foreground">{course.instructor_bio}</p>
              </div>
            )}

            {/* Curriculum */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">কারিকুলাম</h2>
              {modules.map((mod) => (
                <Card key={mod.id} className="mb-3">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    {mod.lessons
                      ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 border-t py-2 text-sm"
                        >
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.is_free && (
                            <Badge variant="secondary" className="text-xs">
                              ফ্রি
                            </Badge>
                          )}
                          {lesson.duration_minutes > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration_minutes} মিনিট
                            </span>
                          )}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
              {modules.length === 0 && (
                <p className="text-muted-foreground">কারিকুলাম শীঘ্রই আসছে...</p>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">রিভিউ ও রেটিং</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium">
                            {review.profiles?.full_name || "অজ্ঞাত"}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">এখনো কোনো রিভিউ নেই।</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <p className="mb-1 text-3xl font-bold text-primary">
                  ৳{Number(course.price).toLocaleString("bn-BD")}
                </p>
                {course.original_price && Number(course.original_price) > Number(course.price) && (
                  <p className="mb-4 text-sm text-muted-foreground line-through">
                    ৳{Number(course.original_price).toLocaleString("bn-BD")}
                  </p>
                )}
                {enrolled ? (
                  <Link href={`/learn/${courseId}`}>
                    <Button className="w-full" size="lg">
                      <CheckCircle className="mr-2 h-5 w-5" />কোর্স শুরু করুন
                    </Button>
                  </Link>
                ) : user ? (
                  <Link href={`/checkout/${courseId}`}>
                    <Button className="w-full" size="lg">
                      কোর্সটি কিনুন
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button className="w-full" size="lg">
                      লগ-ইন করে কিনুন
                    </Button>
                  </Link>
                )}
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>✓ আজীবন অ্যাক্সেস</p>
                  <p>✓ মোবাইল ও ডেস্কটপে দেখুন</p>
                  <p>✓ সার্টিফিকেট পাবেন</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
