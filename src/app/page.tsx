"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  BookOpen,
  Code,
  Palette,
  TrendingUp,
  Award,
  Star,
  Clock,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PremiumLoader } from "@/components/PremiumLoader";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/use-site-content";

const STATS = [
  {
    icon: "🎓",
    target: 18022,
    label: "নিবন্ধিত শিক্ষার্থী",
    gradient: "from-sky-400 to-sky-500",
  },
  {
    icon: "👁️",
    target: 115889,
    label: "মোট ভিজিটর",
    gradient: "from-blue-400 to-blue-500",
  },
  {
    icon: "👨‍🏫",
    target: 16,
    label: "নিবন্ধিত শিক্ষক",
    gradient: "from-blue-500 to-indigo-600",
  },
] as const;

export default function HomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [loaderDone, setLoaderDone] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  // Check if loader should be skipped (returning to page) and restore cached data
  useEffect(() => {
    const wasLoaded = sessionStorage.getItem("homeLoaded");
    if (wasLoaded) {
      setShowLoader(false);
      setLoaderDone(true);
      setIsReturning(true);
      // Restore cached data instantly
      try {
        const cached = sessionStorage.getItem("homeData");
        if (cached) {
          const { courses: cc, bestsellers: bs, categories: cat, testimonials: tt, banners: bb } = JSON.parse(cached);
          setCourses(cc || []);
          setBestsellers(bs || []);
          setCategories(cat || []);
          setTestimonials(tt || []);
          setBanners(bb || []);
          setDataLoaded(true);
        }
      } catch {}
    }
  }, []);
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0]);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const statsSectionRef = useRef<HTMLElement | null>(null);
  const statsAnimationStartedRef = useRef(false);

  const heroTitle = useSiteContent("home.hero.title");
  const heroSubtitle = useSiteContent("home.hero.subtitle");
  const heroCta = useSiteContent("home.hero.cta");
  const heroImage = useSiteContent("home.hero.image");
  const heroOverlay = useSiteContent("home.hero.image_overlay");
  const latestTitle = useSiteContent("home.latest.title");
  const latestSubtitle = useSiteContent("home.latest.subtitle");
  const bestsellerTitle = useSiteContent("home.bestseller.title");
  const bestsellerSubtitle = useSiteContent("home.bestseller.subtitle");
  const whyTitle = useSiteContent("home.why.title");
  const whySubtitle = useSiteContent("home.why.subtitle");
  const why1t = useSiteContent("home.why.1.title");
  const why1d = useSiteContent("home.why.1.desc");
  const why2t = useSiteContent("home.why.2.title");
  const why2d = useSiteContent("home.why.2.desc");
  const why3t = useSiteContent("home.why.3.title");
  const why3d = useSiteContent("home.why.3.desc");
  const callTitle = useSiteContent("home.call.title");
  const callSubtitle = useSiteContent("home.call.subtitle");
  const callPhone = useSiteContent("home.call.phone");
  const instTitle = useSiteContent("home.instructor.title");
  const instSubtitle = useSiteContent("home.instructor.subtitle");
  const instCta = useSiteContent("home.instructor.cta");
  const instImage = useSiteContent("home.instructor.image");
  const newsletterTitle = useSiteContent("home.newsletter.title");
  const newsletterPlaceholder = useSiteContent("home.newsletter.placeholder");
  const newsletterCta = useSiteContent("home.newsletter.cta");
  const testimonialsTitle = useSiteContent("home.testimonials.title");

  useEffect(() => {
    const loadData = async () => {
      const [c, cat, t, b] = await Promise.all([
        supabase
          .from("courses")
          .select("*, categories(name)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("categories").select("*").order("name").limit(6),
        supabase
          .from("testimonials")
          .select("*")
          .eq("is_active", true)
          .order("sort_order")
          .limit(6),
        supabase
          .from("promo_banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      setCourses(c.data ?? []);
      setCategories(cat.data ?? []);
      setTestimonials(t.data ?? []);
      setBanners(b.data ?? []);

      // Fetch bestsellers based on actual approved orders
      const { data: approvedOrders } = await supabase
        .from("orders")
        .select("course_id")
        .eq("status", "approved");

      if (approvedOrders && approvedOrders.length > 0) {
        // Count orders per course
        const countMap: Record<string, number> = {};
        approvedOrders.forEach((o: any) => {
          if (o.course_id) countMap[o.course_id] = (countMap[o.course_id] || 0) + 1;
        });
        // Sort by count, take top 6
        const topCourseIds = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([id]) => id);

        if (topCourseIds.length > 0) {
          const { data: bestData } = await supabase
            .from("courses")
            .select("*")
            .in("id", topCourseIds)
            .eq("is_published", true);
          // Re-sort by order count
          const sorted = (bestData ?? []).sort(
            (a: any, b: any) => (countMap[b.id] || 0) - (countMap[a.id] || 0)
          );
          setBestsellers(sorted);
        } else {
          setBestsellers([]);
        }
      } else {
        // Fallback: use enrollment_count if no orders exist
        const { data: fallback } = await supabase
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .order("enrollment_count", { ascending: false })
          .limit(6);
        setBestsellers(fallback ?? []);
      }
      setDataLoaded(true);
    };
    loadData();
  }, []);

  // Cache homepage data for instant restore on return navigation
  useEffect(() => {
    if (dataLoaded && courses.length > 0) {
      try {
        sessionStorage.setItem("homeData", JSON.stringify({
          courses, bestsellers, categories, testimonials, banners,
        }));
      } catch {}
    }
  }, [dataLoaded, courses, bestsellers, categories, testimonials, banners]);

  const heroImgSrc = heroImage || "/Gemini_Generated_Image_fornqhfornqhforn.png";
  const instImgSrc = instImage || "/instructor-cta.png";
  const marqueeBanners = [...banners, ...banners];

  useEffect(() => {
    const section = statsSectionRef.current;

    if (!section || statsAnimationStartedRef.current) {
      return;
    }

    let animationFrame = 0;

    const startAnimation = () => {
      if (statsAnimationStartedRef.current) {
        return;
      }

      statsAnimationStartedRef.current = true;
      const duration = 2000;
      const startTime = performance.now();

      const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

      const tick = (now: number) => {
        const elapsed = Math.min((now - startTime) / duration, 1);
        const eased = easeOutCubic(elapsed);

        setAnimatedStats(STATS.map((stat) => Math.round(stat.target * eased)));

        if (elapsed < 1) {
          animationFrame = window.requestAnimationFrame(tick);
        }
      };

      animationFrame = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
  }, []);

  // Only hide loader when BOTH loader animation is done AND data is loaded
  useEffect(() => {
    if (loaderDone && dataLoaded) {
      setShowLoader(false);
      sessionStorage.setItem("homeLoaded", "1");
    }
  }, [loaderDone, dataLoaded]);

  return (
    <>
      <AnimatePresence>
        {showLoader && <PremiumLoader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      <motion.div
        className="flex min-h-screen flex-col"
        initial={isReturning ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
      <Navbar />

      {/* Hero Section */}
      <section className="px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-7xl rounded-[2rem] border-2 border-blue-500 bg-[#f4f8ff] px-6 py-8 shadow-[0_14px_40px_rgba(59,130,246,0.08)] md:px-10 md:py-10 lg:px-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 max-w-xl py-4 md:py-10">
              <h1 className="mb-4 text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="mb-8 max-w-lg text-base font-semibold text-foreground/85 md:text-lg">
                {heroSubtitle}
              </p>
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-sky-500 px-6 text-base font-semibold shadow-lg shadow-sky-500/20 hover:bg-sky-600"
                >
                  {heroCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <svg
                className="pointer-events-none absolute -bottom-8 left-40 hidden h-24 w-72 text-sky-200 md:block lg:left-52"
                viewBox="0 0 200 80"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 15 Q 80 -10, 130 30 T 190 60"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M180 52 L 192 60 L 182 70"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[1.4rem] shadow-[0_16px_50px_rgba(37,99,235,0.18)] ring-1 ring-blue-500/20">
                <Image
                  src={heroImgSrc}
                  alt="ইন্ডাস্ট্রি এক্সপার্টদের সাথে শিখুন"
                  width={800}
                  height={600}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      {banners.length > 0 && (
        <section className="px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <div
              className="promo-marquee-mask"
              style={{
                ["--marquee-duration" as string]: `${Math.max(18, banners.length * 8)}s`,
              }}
            >
              <div className="promo-marquee-track">
                {marqueeBanners.map((b, index) => {
                  const inner = (
                    <div className="group h-full overflow-hidden rounded-[1.5rem] shadow-md transition-transform duration-500 hover:-translate-y-0.5 hover:shadow-xl">
                      <Image
                        src={b.image_url}
                        alt={b.title ?? ""}
                        width={600}
                        height={200}
                        loading="lazy"
                        className="h-32 w-105 rounded-[1.5rem] object-cover transition-transform duration-500 group-hover:scale-[1.03] md:h-36 md:w-110"
                      />
                    </div>
                  );

                  return b.link_url ? (
                    <a
                      key={`${b.id}-${index}`}
                      href={b.link_url}
                      className="shrink-0"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={`${b.id}-${index}`} className="shrink-0">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Courses */}
      {courses.length > 0 && (
        <section className="bg-sky-50/50 px-4 py-14 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-foreground md:text-4xl">
                {latestTitle}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {latestSubtitle}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group overflow-hidden rounded-2xl border border-sky-100 bg-card shadow-sm transition-shadow hover:shadow-xl cursor-pointer"
                >
                  <div className="relative">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.title}
                        width={600}
                        height={300}
                        className="h-52 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-muted text-muted-foreground">
                        কোর্স
                      </div>
                    )}
                    {(c.enrollment_count ?? 0) > 0 && (
                      <span className="absolute bottom-3 left-3 rounded-md border border-sky-200 bg-white/95 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                        {Number(c.enrollment_count).toLocaleString("bn-BD")} জন +
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-3 py-1 text-sm font-bold text-sky-600 shadow-sm">
                      ৳ {Number(c.price).toLocaleString("bn-BD")}
                      {c.original_price &&
                        Number(c.original_price) > Number(c.price) && (
                          <span className="ml-2 text-xs font-medium text-red-500 line-through">
                            {Number(c.original_price).toLocaleString("bn-BD")}
                          </span>
                        )}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-5 min-h-14 text-center text-base font-bold text-foreground">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <span>{c.duration_text || "—"}</span>
                      </div>
                      <span className="rounded-full border border-sky-400 px-4 py-1.5 text-sm font-medium text-sky-600 group-hover:bg-sky-50">
                        কোর্সটি কিনুন
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-linear-to-r from-sky-500 to-blue-500 px-10 text-base font-semibold shadow-lg hover:from-sky-600 hover:to-blue-600"
                >
                  সকল কোর্স <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Best Selling Courses */}
      {bestsellers.length > 0 && (
        <section className="px-4 py-14 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-foreground md:text-4xl">
                {bestsellerTitle}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {bestsellerSubtitle}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bestsellers.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group overflow-hidden rounded-2xl border border-sky-100 bg-card shadow-sm transition-shadow hover:shadow-xl cursor-pointer"
                >
                  <div className="relative">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.title}
                        width={600}
                        height={300}
                        className="h-52 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-muted text-muted-foreground">
                        কোর্স
                      </div>
                    )}
                    {(c.enrollment_count ?? 0) > 0 && (
                      <span className="absolute bottom-3 left-3 rounded-md border border-sky-200 bg-white/95 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                        {Number(c.enrollment_count).toLocaleString("bn-BD")} জন +
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-3 py-1 text-sm font-bold text-sky-600 shadow-sm">
                      ৳ {Number(c.price).toLocaleString("bn-BD")}
                      {c.original_price &&
                        Number(c.original_price) > Number(c.price) && (
                          <span className="ml-2 text-xs font-medium text-red-500 line-through">
                            {Number(c.original_price).toLocaleString("bn-BD")}
                          </span>
                        )}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-5 min-h-14 text-center text-base font-bold text-foreground">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <span>{c.duration_text || "—"}</span>
                      </div>
                      <span className="rounded-full border border-sky-400 px-4 py-1.5 text-sm font-medium text-sky-600 group-hover:bg-sky-50">
                        কোর্সটি কিনুন
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-linear-to-r from-sky-500 to-blue-500 px-10 text-base font-semibold shadow-lg hover:from-sky-600 hover:to-blue-600"
                >
                  সকল কোর্স <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section ref={statsSectionRef} className="px-4 py-12 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((s, index) => (
            <div
              key={s.label}
              className={`flex items-center gap-5 rounded-2xl bg-linear-to-r ${s.gradient} px-6 py-6 shadow-lg`}
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-4xl shadow-md">
                {s.icon}
              </div>
              <div className="text-white">
                <p className="text-3xl font-extrabold leading-tight md:text-4xl">
                  {new Intl.NumberFormat("en-US").format(animatedStats[index])}
                  {animatedStats[index] >= s.target ? "+" : ""}
                </p>
                <p className="mt-1 text-base font-medium opacity-95">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="bg-sky-50/40 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-foreground md:text-4xl">
              {whyTitle}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">{whySubtitle}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🎓", title: why1t, desc: why1d },
              { icon: "💻", title: why2t, desc: why2d },
              { icon: "👨‍🏫", title: why3t, desc: why3d },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-card px-6 py-10 text-center shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-sky-50 text-5xl">
                  {f.icon}
                </div>
                <h3 className="mb-4 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call CTA */}
      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl bg-black px-8 py-10 shadow-xl md:flex-row md:items-center md:px-12">
          <div>
            <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
              {callTitle}
            </h3>
            <p className="text-sm text-gray-300">{callSubtitle}</p>
          </div>
          <a
            href={`tel:${callPhone.replace(/[^+\d]/g, "")}`}
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-green-600"
          >
            <Phone className="h-5 w-5" />
            {callPhone}
          </a>
        </div>
      </section>

      {/* Become Instructor CTA */}
      <section className="px-4 py-10 md:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-blue-600 shadow-xl">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="px-8 py-12 md:px-14 md:py-16">
              <h3 className="mb-4 text-xl font-bold leading-relaxed text-white md:text-2xl">
                {instTitle}
              </h3>
              <p className="mb-6 text-lg font-semibold text-white/95">{instSubtitle}</p>
              <Link href="/become-instructor">
                <Button className="rounded-full bg-white px-8 text-base font-semibold text-blue-600 hover:bg-white/90">
                  {instCta}
                </Button>
              </Link>
            </div>
            <div className="relative flex h-full items-end justify-center md:justify-end">
              <Image
                src={instImgSrc}
                alt="ইন্সট্রাকটর"
                width={768}
                height={768}
                loading="lazy"
                className="h-72 w-auto object-contain md:h-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-blue-600 px-6 py-10 shadow-xl md:px-12">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const emailInput = form.querySelector("input[type=email]") as HTMLInputElement;
              const email = emailInput?.value?.trim();
              if (!email) return;
              
              // Save subscriber and notify admin
              await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              emailInput.value = "";
              setSubscribeSuccess(true);
              setTimeout(() => setSubscribeSuccess(false), 4000);
            }}
            className="flex flex-col items-center justify-between gap-6 md:flex-row"
          >
            <h3 className="text-center text-lg font-bold text-white md:text-left md:text-xl">
              {newsletterTitle}
            </h3>
            <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5 sm:shadow-md">
              <input
                type="email"
                required
                maxLength={255}
                placeholder={newsletterPlaceholder}
                className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground shadow-md outline-none placeholder:text-muted-foreground sm:rounded-none sm:bg-transparent sm:py-2 sm:shadow-none"
              />
              <Button
                type="submit"
                className="w-full rounded-full bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 sm:w-auto sm:py-2"
              >
                {newsletterCta}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              {testimonialsTitle}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-6">
                    <div className="mb-3 flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= t.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      &ldquo;{t.comment}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      {t.avatar_url ? (
                        <Image
                          src={t.avatar_url}
                          alt={t.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        {t.role && (
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subscribe success popup */}
      {subscribeSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-card p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">সাবস্ক্রিপশন সফল! 🎉</h3>
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
              ধন্যবাদ! নতুন কোর্স, অফার ও আপডেট সম্পর্কে আমরা আপনাকে জানাব।
            </p>
            <Button className="rounded-full bg-sky-600 px-8 hover:bg-sky-700" onClick={() => setSubscribeSuccess(false)}>
              ঠিক আছে
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </motion.div>
    </>
  );
}
