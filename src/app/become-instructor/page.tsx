"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FileText, Film, CheckCircle, Send, Users, TrendingUp, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BecomeInstructorPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("নাম ও ফোন নম্বর দিন"); return; }
    setSubmitting(true);
    await supabase.from("service_requests").insert({
      full_name: form.name,
      phone: form.phone,
      email: form.email || null,
      service_type: "instructor_application",
      message: form.message || "ইন্সট্রাক্টর হতে চাই",
    });
    await fetch("/api/notify-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "নতুন ইন্সট্রাক্টর আবেদন",
        message: `${form.name} (${form.phone}) ইন্সট্রাক্টর হিসেবে যোগ দিতে চান।`,
        type: "instructor",
        link: "/admin",
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-sky-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20" />
            <div className="absolute -bottom-10 left-1/4 h-60 w-60 rounded-full bg-white/10" />
          </div>
          <div className="relative mx-auto flex max-w-7xl items-center gap-8 px-4 py-16 md:px-8 md:py-24">
            <div className="flex-1 text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
                <Zap className="h-4 w-4 text-yellow-300" />আপনার স্কিল শেয়ার করুন
              </div>
              <h1 className="mb-5 text-3xl font-black leading-[1.1] md:text-5xl lg:text-6xl">
                স্কিলকে সকলের মাঝে<br />ছড়িয়ে দিয়ে আয় করুন
              </h1>
              <p className="mb-8 max-w-xl text-base text-white/80 md:text-lg">
                Zero Space Architect এ ইন্সট্রাক্টর হিসেবে যোগ দিন। প্রতিটি সেল থেকে পান ৪০% কমিশন। আপনার জ্ঞান ভাগ করুন, পরিবর্তন আনুন।
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#apply">
                  <Button size="lg" className="rounded-full bg-white px-8 text-base font-bold text-blue-700 shadow-lg hover:bg-white/90">
                    এখনই আবেদন করুন
                  </Button>
                </a>
                <a href="#how-it-works">
                  <Button size="lg" className="rounded-full border-2 border-white bg-transparent px-8 text-base font-bold text-white hover:bg-white/10">
                    কিভাবে কাজ করে
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-white/5 backdrop-blur-sm" />
                <Image src="/instructor-cta.png" alt="Instructor" width={380} height={480} className="relative h-80 w-auto object-contain lg:h-96" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-card px-4 py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
            <AnimatedStat icon={Users} target={100} suffix="+" label="ইন্সট্রাক্টর" />
            <AnimatedStat icon={TrendingUp} target={40} suffix="%" label="কমিশন" />
            <AnimatedStat icon={Award} target={18000} suffix="+" label="শিক্ষার্থী" />
            <AnimatedStat icon={Film} target={50} suffix="+" label="কোর্স" />
          </div>
        </section>

        {/* Commission Section */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-3xl font-black text-foreground md:text-4xl">
                  স্কিল ছড়িয়ে যাবে,<br />
                  <span className="text-sky-600">অতিরিক্ত আয়ও হবে</span>
                </h2>
                <p className="mb-6 text-muted-foreground">
                  প্রতিটি সেল থেকে আপনি পাবেন ৪০% সম্মানী। কোনো বিনিয়োগ নেই, শুধু আপনার স্কিল আর সময়।
                </p>
                <div className="space-y-3">
                  {["কোনো বিনিয়োগ লাগবে না", "নিজের সময়ে কাজ করুন", "আনলিমিটেড ইনকাম পটেনশিয়াল", "প্রফেশনাল স্টুডিও সাপোর্ট"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "আপনি পাবেন", value: "40%", color: "from-blue-500 to-blue-600" },
                  { label: "Zero Space", value: "40%", color: "from-sky-500 to-sky-600" },
                  { label: "মার্কেটিং", value: "20%", color: "from-slate-500 to-slate-600" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                    <div className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${item.color}`}>
                      <span className="text-xl font-black text-white">{item.value}</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="bg-[#f0f7ff] px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-center text-2xl font-black text-foreground md:text-3xl">
              একটি কোর্সের জন্য আপনার কাজ
            </h2>
            <div className="mx-auto mb-10 h-1 w-16 rounded-full bg-sky-400" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
                <div className="h-44 overflow-hidden">
                  <Image src="/Instructor1.png" alt="কোর্সের আউটলাইন" width={500} height={250} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-foreground">কোর্সের আউটলাইন সাজানো</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    কোর্সের জন্য সুন্দর, স্ট্যান্ডার্ড এবং ইউনিক জব অরিয়েন্টেড কোর্স আউটলাইন সাজানো। আউটলাইন হচ্ছে একটি কোর্সের প্রাণ।
                  </p>
                </div>
              </div>
              <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
                <div className="h-44 overflow-hidden">
                  <Image src="/Instractor2.png" alt="কোর্স রেকর্ড" width={500} height={250} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-foreground">কোর্স রেকর্ড করা</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    আমাদের প্রফেশনাল স্টুডিওতে এসে কোর্সের ভিডিও-সমূহ রেকর্ড করতে হয়। কোয়ালিটি কন্টেন্ট আমাদের প্রধান লক্ষ্য।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform's Work - Auto Rotating */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-2xl font-black text-foreground md:text-3xl">আমরা যা করি</h2>
            <div className="mb-8 h-1 w-16 rounded-full bg-sky-400" />
            <PlatformWorkCarousel />
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-14">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="mb-3 text-3xl font-black md:text-4xl">একত্রে শিখাই, দেশকে এগিয়ে নিয়ে যাই</h2>
            <p className="mb-6 text-white/80">আপনার অভিজ্ঞতা ও জ্ঞান দিয়ে হাজারো শিক্ষার্থীর জীবন পরিবর্তন করুন</p>
            <a href="#apply">
              <Button size="lg" className="rounded-full bg-white px-10 text-base font-bold text-blue-700 shadow-lg hover:bg-white/90">
                এখনই আবেদন করুন
              </Button>
            </a>
          </div>
        </section>

        {/* Contact Form */}
        <section id="apply" className="px-4 py-16">
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-5 text-center text-white">
                <h2 className="text-xl font-bold">ইন্সট্রাক্টর হিসেবে আবেদন করুন</h2>
                <p className="mt-1 text-sm text-white/80">ফর্ম পূরণ করুন, আমরা যোগাযোগ করব</p>
              </div>

              {submitted ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">আবেদন সফল! 🎉</h3>
                  <p className="text-sm text-muted-foreground">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  <div>
                    <Label>আপনার নাম *</Label>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="পূর্ণ নাম" />
                  </div>
                  <div>
                    <Label>ফোন নম্বর *</Label>
                    <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="০১XXXXXXXXX" />
                  </div>
                  <div>
                    <Label>ইমেইল</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label>আপনার সম্পর্কে / বিষয়</Label>
                    <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="আপনি কোন বিষয়ে কোর্স করাতে চান..." rows={3} />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full rounded-full bg-sky-600 py-3 text-base font-semibold hover:bg-sky-700">
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "পাঠানো হচ্ছে..." : "আবেদন পাঠান"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

/* Animated counting stat */
function AnimatedStat({ icon: Icon, target, suffix, label }: { icon: any; target: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const startTime = performance.now();
        const tick = (now: number) => {
          const elapsed = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - elapsed, 3);
          setCount(Math.round(target * eased));
          if (elapsed < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
        <Icon className="h-6 w-6 text-sky-600" />
      </div>
      <p className="text-2xl font-black text-foreground">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* Auto-rotating carousel for platform work */
function PlatformWorkCarousel() {
  const items = [
    "আউটলাইন অনুযায়ী PDF সুন্দরভাবে রি-ডিজাইন",
    "প্রফেশনাল স্টুডিওতে কোর্স রেকর্ড",
    "প্রতিটি ভিডিও প্রফেশনালি এডিট",
    "কোয়ালিটি চেক ও কমিশন শুরু",
    "ওয়েবসাইটে পাবলিশ ও মার্কেটিং",
    "সার্টিফিকেট ও সাপোর্ট ম্যানেজমেন্ট",
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div>
      {/* Active item highlight */}
      <div className="mb-6 overflow-hidden rounded-2xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6 transition-all">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white shadow-lg">
            {active + 1}
          </div>
          <p className="text-lg font-bold text-foreground">{items[active]}</p>
        </div>
      </div>

      {/* All items as dots/indicators */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-xl border p-3 text-center transition-all ${
              i === active
                ? "border-sky-400 bg-sky-50 shadow-sm"
                : "border-transparent bg-muted/50 hover:bg-muted"
            }`}
          >
            <div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i === active ? "bg-sky-600 text-white" : "bg-muted-foreground/10 text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <p className={`text-[10px] leading-tight ${i === active ? "font-semibold text-sky-700" : "text-muted-foreground"}`}>
              {item.split(" ").slice(0, 3).join(" ")}...
            </p>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex gap-1">
        {items.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full bg-sky-500 transition-all duration-[3000ms] ease-linear ${
                i === active ? "w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
