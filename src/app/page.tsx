"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Code,
  Palette,
  TrendingUp,
  Briefcase,
  Award,
  Star,
  Clock,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CourseCard } from "@/components/CourseCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/use-site-content";

const CATEGORY_ICONS = [Code, Palette, TrendingUp, Briefcase, BookOpen, Award];

export default function HomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  const heroTitle = useSiteContent("home.hero.title");
  const heroSubtitle = useSiteContent("home.hero.subtitle");
  const heroCta = useSiteContent("home.hero.cta");
  const heroImage = useSiteContent("home.hero.image");
  const heroOverlay = useSiteContent("home.hero.image_overlay");
  const latestTitle = useSiteContent("home.latest.title");
  const latestSubtitle = useSiteContent("home.latest.subtitle");
  const bestsellerTitle = useSiteContent("home.bestseller.title");
  const bestsellerSubtitle = useSiteContent("home.bestseller.subtitle");
  const stat1v = useSiteContent("home.stats.1.value");
  const stat1l = useSiteContent("home.stats.1.label");
  const stat2v = useSiteContent("home.stats.2.value");
  const stat2l = useSiteContent("home.stats.2.label");
  const stat3v = useSiteContent("home.stats.3.value");
  const stat3l = useSiteContent("home.stats.3.label");
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
    Promise.all([
      supabase
        .from("courses")
        .select("*, categories(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("enrollment_count", { ascending: false })
        .limit(6),
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
    ]).then(([c, bs, cat, t, b]) => {
      setCourses(c.data ?? []);
      setBestsellers(bs.data ?? []);
      setCategories(cat.data ?? []);
      setTestimonials(t.data ?? []);
      setBanners(b.data ?? []);
    });
  }, []);

  const heroImgSrc = heroImage || "/hero-instructors.jpg";
  const instImgSrc = instImage || "/instructor-cta.png";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-background to-blue-50 px-6 py-10 shadow-sm md:px-12 md:py-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="relative z-10">
              <h1 className="mb-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="mb-8 text-base font-medium text-muted-foreground md:text-lg">
                {heroSubtitle}
              </p>
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-sky-500 px-8 text-base font-semibold shadow-lg hover:bg-sky-600"
                >
                  {heroCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <svg
                className="absolute -bottom-6 left-56 hidden h-20 w-48 text-sky-300 md:block"
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
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-sky-100">
                <Image
                  src={heroImgSrc}
                  alt="ইন্ডাস্ট্রি এক্সপার্টদের সাথে শিখুন"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover"
                  priority
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-sky-600/50 via-sky-500/20 to-transparent p-6 text-center">
                  <p className="whitespace-pre-line text-xl font-bold text-white drop-shadow-lg md:text-2xl">
                    {heroOverlay}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      {banners.length > 0 && (
        <section className="px-4 py-6 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => {
              const inner = (
                <div className="group overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-xl">
                  <Image
                    src={b.image_url}
                    alt={b.title ?? ""}
                    width={600}
                    height={200}
                    loading="lazy"
                    className="h-32 w-full object-cover transition-transform group-hover:scale-105 md:h-36"
                  />
                </div>
              );
              return b.link_url ? (
                <a key={b.id} href={b.link_url}>
                  {inner}
                </a>
              ) : (
                <div key={b.id}>{inner}</div>
              );
            })}
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
                <div
                  key={c.id}
                  className="overflow-hidden rounded-2xl border border-sky-100 bg-card shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.title}
                        width={600}
                        height={300}
                        className="h-52 w-full object-cover"
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
                    <h3 className="mb-5 min-h-[3.5rem] text-center text-base font-bold text-foreground">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <span>{c.duration_text || "—"}</span>
                      </div>
                      <Link href={`/courses/${c.id}`}>
                        <Button
                          variant="outline"
                          className="rounded-full border-sky-400 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                        >
                          কোর্সটি কিনুন
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-10 text-base font-semibold shadow-lg hover:from-sky-600 hover:to-blue-600"
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
                <div
                  key={c.id}
                  className="overflow-hidden rounded-2xl border border-sky-100 bg-card shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.title}
                        width={600}
                        height={300}
                        className="h-52 w-full object-cover"
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
                    <h3 className="mb-5 min-h-[3.5rem] text-center text-base font-bold text-foreground">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <span>{c.duration_text || "—"}</span>
                      </div>
                      <Link href={`/courses/${c.id}`}>
                        <Button
                          variant="outline"
                          className="rounded-full border-sky-400 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                        >
                          কোর্সটি কিনুন
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-10 text-base font-semibold shadow-lg hover:from-sky-600 hover:to-blue-600"
                >
                  সকল কোর্স <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="px-4 py-12 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "🎓",
              value: stat1v,
              label: stat1l,
              gradient: "from-sky-400 to-sky-500",
            },
            {
              icon: "👁️",
              value: stat2v,
              label: stat2l,
              gradient: "from-blue-400 to-blue-500",
            },
            {
              icon: "👨‍🏫",
              value: stat3v,
              label: stat3l,
              gradient: "from-blue-500 to-indigo-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-5 rounded-2xl bg-gradient-to-r ${s.gradient} px-6 py-6 shadow-lg`}
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-4xl shadow-md">
                {s.icon}
              </div>
              <div className="text-white">
                <p className="text-3xl font-extrabold leading-tight md:text-4xl">
                  {s.value}
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
              <Link href="/register">
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
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex flex-col items-center justify-between gap-6 md:flex-row"
          >
            <h3 className="text-center text-lg font-bold text-white md:text-left md:text-xl">
              {newsletterTitle}
            </h3>
            <div className="flex w-full max-w-xl items-center rounded-full bg-white p-1.5 shadow-md">
              <input
                type="email"
                required
                maxLength={255}
                placeholder={newsletterPlaceholder}
                className="flex-1 bg-transparent px-5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                className="rounded-full bg-blue-600 px-6 font-semibold hover:bg-blue-700"
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

      <Footer />
    </div>
  );
}
