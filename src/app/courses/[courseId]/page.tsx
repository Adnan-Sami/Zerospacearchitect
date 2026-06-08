"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import {
  Star, Clock, BookOpen, PlayCircle, CheckCircle,
  ChevronDown, ChevronUp, Lock, Users, Award, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Certificate } from "@/components/Certificate";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
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
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const settings = useSiteSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        setLoading(false);
        return;
      }

      const { data: courseData, error } = await supabase
        .from("courses")
        .select("*, categories(name)")
        .eq("id", courseId)
        .single();

      if (error) console.error("Course fetch error:", error.message);
      setCourse(courseData);
      if (!courseData) { setLoading(false); return; }

      const [modulesRes, reviewsRes] = await Promise.all([
        supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("sort_order"),
        supabase.from("reviews").select("*, profiles(full_name)").eq("course_id", courseId).order("created_at", { ascending: false }),
      ]);

      const mods = modulesRes.data ?? [];
      setModules(mods);
      setReviews(reviewsRes.data ?? []);
      if (mods.length > 0) setOpenModules(new Set([mods[0].id]));

      if (user) {
        const { data: enrollment } = await supabase.from("enrollments").select("id").eq("course_id", courseId).eq("user_id", user.id).maybeSingle();
        setEnrolled(!!enrollment);

        if (enrollment) {
          // Get student name
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
          setStudentName(profile?.full_name || "");

          // Check completion
          const allLessons = mods.flatMap((m: any) => m.lessons?.map((l: any) => l.id) ?? []);
          if (allLessons.length > 0) {
            const { data: progress } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).eq("completed", true).in("lesson_id", allLessons);
            if ((progress?.length ?? 0) >= allLessons.length) {
              setCourseCompleted(true);
            }
          }
        }
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId, user]);

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
  const totalDuration = modules.reduce((sum, m) => sum + (m.lessons?.reduce((s: number, l: any) => s + (l.duration_minutes ?? 0), 0) ?? 0), 0);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 py-20 text-center text-muted-foreground">লোড হচ্ছে...</div>
        <Footer />
      </div>
    );

  if (!course)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">কোর্স পাওয়া যায়নি।</p>
          <p className="mt-2 text-sm text-muted-foreground">কোর্সটি পাবলিশড না হলে দেখা যাবে না।</p>
          <Link href="/courses" className="mt-4 inline-block text-sm text-sky-600 underline">সকল কোর্স দেখুন</Link>
        </div>
        <Footer />
      </div>
    );

  const whatWillLearn = course.what_will_learn?.split("\n").filter(Boolean) ?? [];
  const requirements = course.requirements?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* ── Hero Banner ── */}
      <div className="bg-[#f0f7ff]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
          <div className="flex items-start gap-8">
            {/* Left hero content */}
            <div className="min-w-0 flex-1">
              {course.categories?.name && (
                <Badge variant="secondary" className="mb-3">{course.categories.name}</Badge>
              )}
              <h1 className="mb-4 text-3xl font-black leading-tight text-foreground md:text-4xl lg:text-5xl">
                {course.title}
              </h1>
              {course.description && (
                <p className="mb-6 text-base leading-relaxed text-foreground/80">
                  {course.description}
                </p>
              )}

              {/* Stats row — no border pills, just icons + text */}
              <div className="mb-6 flex flex-wrap items-center gap-5 text-sm text-foreground/70">
                {(course.enrollment_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-sky-500" />
                    {Number(course.enrollment_count).toLocaleString("bn-BD")} শিক্ষার্থী
                  </span>
                )}
                {totalLessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-sky-500" />
                    {totalLessons} টি লেসন
                  </span>
                )}
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-sky-500" />
                    {totalDuration} মিনিট
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {avgRating.toFixed(1)}
                    <span className="text-foreground/50">({reviews.length} রিভিউ)</span>
                  </span>
                )}
              </div>

              {/* Instructor card */}
              {course.instructor_name && (
                <div className="flex items-center gap-5 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
                  {course.instructor_avatar ? (
                    <Image src={course.instructor_avatar} alt={course.instructor_name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl font-black text-sky-600">
                      {course.instructor_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইন্সট্রাক্টর</p>
                    <p className="mt-0.5 text-base font-bold text-foreground">{course.instructor_name}</p>
                    {course.instructor_bio && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{course.instructor_bio}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar width placeholder */}
            <div className="hidden w-80 shrink-0 lg:block" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
          <div className="flex items-start gap-8">

            {/* LEFT */}
            <div className="min-w-0 flex-1 space-y-5">

              {/* Mobile sidebar */}
              <div className="lg:hidden">
                <SidebarCard course={course} courseId={courseId} enrolled={enrolled} user={user} totalLessons={totalLessons} totalDuration={totalDuration} />
              </div>

              {/* What you'll learn */}
              {whatWillLearn.length > 0 && (
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-sky-50 px-6 py-4">
                    <h2 className="font-bold text-foreground">কোর্সে কী শিখবেন</h2>
                  </div>
                  <div className="p-6">
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {whatWillLearn.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Requirements */}
              {requirements.length > 0 && (
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-sky-50 px-6 py-4">
                    <h2 className="font-bold text-foreground">পূর্বশর্ত</h2>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-2">
                      {requirements.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Curriculum */}
              <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="bg-sky-600 px-6 py-4">
                  <h2 className="font-bold text-white">কোর্স কারিকুলাম</h2>
                  <p className="mt-0.5 text-xs text-sky-100">
                    {modules.length} সেকশন · {totalLessons} লেসন
                    {totalDuration > 0 && ` · ${totalDuration} মিনিট`}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {modules.map((mod) => {
                    const isOpen = openModules.has(mod.id);
                    const modDuration = mod.lessons?.reduce((s: number, l: any) => s + (l.duration_minutes ?? 0), 0) ?? 0;
                    return (
                      <div key={mod.id}>
                        <button
                          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/50"
                          onClick={() => toggleModule(mod.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isOpen
                              ? <ChevronUp className="h-4 w-4 text-sky-600" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm font-semibold text-foreground">{mod.title}</span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {mod.lessons?.length ?? 0} লেসন{modDuration > 0 && ` · ${modDuration} মি`}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="border-t bg-muted/30">
                            {mod.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center gap-3 border-b border-border/50 px-6 py-3 last:border-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                                  {lesson.lesson_type === "quiz"
                                    ? <BookOpen className="h-3.5 w-3.5" />
                                    : <PlayCircle className="h-3.5 w-3.5" />}
                                </div>
                                <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                                <div className="flex items-center gap-2">
                                  {lesson.duration_minutes > 0 && (
                                    <span className="text-xs text-muted-foreground">{lesson.duration_minutes} মি</span>
                                  )}
                                  {lesson.is_free
                                    ? <Badge variant="secondary" className="px-2 py-0 text-xs">ফ্রি</Badge>
                                    : <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {modules.length === 0 && (
                    <p className="px-6 py-8 text-center text-sm text-muted-foreground">কারিকুলাম শীঘ্রই আসছে।</p>
                  )}
                </div>
              </section>

              {/* Instructor full bio */}
              {course.instructor_name && course.instructor_bio && (
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-sky-50 px-6 py-4">
                    <h2 className="font-bold text-foreground">কোর্স ইন্সট্রাক্টর</h2>
                  </div>
                  <div className="flex items-start gap-5 p-6">
                    {course.instructor_avatar ? (
                      <Image src={course.instructor_avatar} alt={course.instructor_name} width={80} height={80} className="h-20 w-20 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100 text-3xl font-black text-sky-600">
                        {course.instructor_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-foreground">{course.instructor_name}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{course.instructor_bio}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-sky-50 px-6 py-4">
                    <h2 className="font-bold text-foreground">শিক্ষার্থীদের রিভিউ</h2>
                  </div>
                  <div className="divide-y divide-border p-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                          {(review.profiles?.full_name || "?")[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {review.profiles?.full_name || "অজ্ঞাত"}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Certificate Section */}
              {course.certificate_enabled !== false && (
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-sky-50 px-6 py-4">
                    <h2 className="font-bold text-sky-600">কোর্স সার্টিফিকেট</h2>
                  </div>
                  <div className="p-6">
                    <p className="mb-4 text-sm text-muted-foreground">
                      কোর্সটি সফলভাবে শেষ করলে আপনার জন্য আছে সার্টিফিকেট
                    </p>
                    {courseCompleted ? (
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-xl border shadow-sm">
                          <Certificate
                            studentName={studentName}
                            courseName={course.title}
                            certificateNumber="CERT-PREVIEW"
                            issuedDate={new Date().toLocaleDateString("bn-BD")}
                            siteName={settings.site_name}
                            title={course.certificate_title}
                            body={course.certificate_body}
                            signature={course.certificate_signature}
                          />
                        </div>
                        <Link href={`/certificate/${courseId}`}>
                          <Button className="w-full rounded-full bg-sky-600 hover:bg-sky-700">
                            <Award className="mr-2 h-4 w-4" />
                            সার্টিফিকেট দেখুন ও ডাউনলোড করুন
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl border">
                        <div className="pointer-events-none select-none opacity-60 blur-[2px]">
                          <Certificate
                            studentName="আপনার নাম"
                            courseName={course.title}
                            certificateNumber="CERT-XXXXXX"
                            issuedDate="তারিখ"
                            siteName={settings.site_name}
                            title={course.certificate_title}
                            body={course.certificate_body}
                            signature={course.certificate_signature}
                          />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                            <Lock className="h-8 w-8 text-white" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-white">
                            {enrolled ? "কোর্স সম্পন্ন করলে আনলক হবে" : "ভর্তি হলে সার্টিফিকেট পাবেন"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>

            {/* RIGHT STICKY */}
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-24 self-start">
                <SidebarCard course={course} courseId={courseId} enrolled={enrolled} user={user} totalLessons={totalLessons} totalDuration={totalDuration} />
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ── Sidebar Card ── */
function SidebarCard({
  course, courseId, enrolled, user, totalLessons, totalDuration,
}: {
  course: any; courseId: string; enrolled: boolean;
  user: User | null; totalLessons: number; totalDuration: number;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const originalPrice = Number(course.price);
  const discount = couponApplied
    ? couponApplied.discount_type === "percent"
      ? Math.round(originalPrice * (couponApplied.discount_value / 100))
      : Math.min(Number(couponApplied.discount_value), originalPrice)
    : 0;
  const finalPrice = Math.max(originalPrice - discount, 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setApplyingCoupon(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!data) { setCouponError("এই কুপন কোড বৈধ নয়।"); setCouponApplied(null); setApplyingCoupon(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError("কুপনের মেয়াদ শেষ।"); setCouponApplied(null); setApplyingCoupon(false); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { setCouponError("কুপনের সীমা শেষ।"); setCouponApplied(null); setApplyingCoupon(false); return; }
    // Check per-user limit
    if (data.per_user_limit) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count: courseUses } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("coupon_code", data.code);
        const { count: bookUses } = await supabase
          .from("book_orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("coupon_code", data.code);
        const totalUserUses = (courseUses ?? 0) + (bookUses ?? 0);
        if (totalUserUses >= data.per_user_limit) {
          setCouponError("আপনি এই কুপনটি সর্বোচ্চ সীমায় ব্যবহার করেছেন।");
          setCouponApplied(null);
          setApplyingCoupon(false);
          return;
        }
      }
    }
    setCouponApplied(data);
    setApplyingCoupon(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      {/* Thumbnail */}
      {course.thumbnail_url && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            width={680}
            height={383}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        {/* Price */}
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <span className="text-3xl font-extrabold text-sky-600">
            ৳{finalPrice.toLocaleString("bn-BD")}
          </span>
          {discount > 0 && (
            <span className="pb-0.5 text-sm text-muted-foreground line-through">
              ৳{originalPrice.toLocaleString("bn-BD")}
            </span>
          )}
          {!discount && course.original_price && Number(course.original_price) > Number(course.price) && (
            <>
              <span className="pb-0.5 text-sm text-muted-foreground line-through">
                ৳{Number(course.original_price).toLocaleString("bn-BD")}
              </span>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                {Math.round((1 - Number(course.price) / Number(course.original_price)) * 100)}% ছাড়
              </span>
            </>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-600">
              ৳{discount} ছাড়
            </span>
          )}
        </div>

        {/* Coupon Input */}
        {!enrolled && Number(course.price) > 0 && (
          <div className="mb-4 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 p-3">
            <p className="mb-2 text-xs font-semibold text-sky-700">🎟️ কুপন কোড আছে?</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="কুপন কোড লিখুন"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                disabled={!!couponApplied}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              {couponApplied ? (
                <button type="button" onClick={() => { setCouponApplied(null); setCouponCode(""); }} className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">সরান</button>
              ) : (
                <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()} className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">{applyingCoupon ? "..." : "প্রয়োগ"}</button>
              )}
            </div>
            {couponError && <p className="mt-1.5 text-[11px] text-red-500">{couponError}</p>}
            {couponApplied && <p className="mt-1.5 text-[11px] font-medium text-green-600">✅ কুপন প্রয়োগ হয়েছে! ৳{discount} ছাড়</p>}
          </div>
        )}

        {/* CTA */}
        {enrolled ? (
          <Link href={`/learn/${courseId}`}>
            <Button className="w-full rounded-full" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />কোর্স শুরু করুন
            </Button>
          </Link>
        ) : user ? (
          <Link href={`/checkout/${courseId}${couponApplied ? `?coupon=${couponApplied.code}` : ""}`}>
            <Button className="w-full rounded-full bg-sky-600 shadow-[0_10px_24px_rgba(2,132,199,0.26)] hover:bg-sky-700" size="lg">
              এখনই ভর্তি হন
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button className="w-full rounded-full bg-sky-600 shadow-[0_10px_24px_rgba(2,132,199,0.26)] hover:bg-sky-700" size="lg">
              লগ-ইন করে ভর্তি হন
            </Button>
          </Link>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">৩০ দিনের মানি-ব্যাক গ্যারান্টি</p>

        {/* Includes */}
        <div className="mt-5 space-y-2.5 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">এই কোর্সে পাবেন</p>
          {totalLessons > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <PlayCircle className="h-4 w-4 shrink-0 text-sky-500" />
              {totalLessons} টি ভিডিও লেসন
            </div>
          )}
          {totalDuration > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Clock className="h-4 w-4 shrink-0 text-sky-500" />
              মোট {totalDuration} মিনিট কন্টেন্ট
            </div>
          )}
          {course.duration_text && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Clock className="h-4 w-4 shrink-0 text-sky-500" />
              {course.duration_text}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Award className="h-4 w-4 shrink-0 text-sky-500" />
            সম্পন্নের সার্টিফিকেট
          </div>
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <BookOpen className="h-4 w-4 shrink-0 text-sky-500" />
            আজীবন অ্যাক্সেস
          </div>
        </div>

        {/* Share */}
        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => navigator.share?.({ title: course.title, url: window.location.href })}
        >
          <Share2 className="h-4 w-4" /> কোর্স শেয়ার করুন
        </button>
      </div>
    </div>
  );
}
