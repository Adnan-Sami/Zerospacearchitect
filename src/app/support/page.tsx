"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Phone, Mail, Headphones, Clock, ArrowRight, Sparkles } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const heroTitle = useSiteContent("support.hero.title");
  const phoneTitle = useSiteContent("support.phone.title");
  const phoneNum = useSiteContent("support.phone.number");
  const emailTitle = useSiteContent("support.email.title");
  const agentImg = useSiteContent("support.agent.image");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4 py-20 text-white md:py-28">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] animate-pulse rounded-full bg-blue-500/10 blur-3xl [animation-delay:1s]" />
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] animate-pulse rounded-full bg-cyan-500/5 blur-3xl [animation-delay:2s]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <div className="animate-[fadeInUp_0.6s_ease-out]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm">
                <Headphones className="h-4 w-4 text-sky-400" />
                <span className="text-white/80">২৪/৭ সাপোর্ট সেবা</span>
              </div>
              <h1 className="mb-5 text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
                {heroTitle || "আমরা আছি আপনার পাশে"}
              </h1>
              <p className="mb-8 max-w-lg text-base text-white/60 md:text-lg">
                যেকোনো সমস্যায় আমাদের সাপোর্ট টিম সবসময় প্রস্তুত। ফোন বা ইমেইলে যোগাযোগ করুন।
              </p>
              <a href={`tel:${phoneNum?.replace(/[^+\d]/g, "")}`}>
                <Button size="lg" className="rounded-full bg-sky-500 px-8 text-base font-bold shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400 hover:shadow-sky-500/40 hover:-translate-y-0.5">
                  <Phone className="mr-2 h-4 w-4" />এখনই কল করুন
                </Button>
              </a>
            </div>

            {/* Agent Image */}
            <div className="hidden md:block">
              <div className="relative animate-[fadeInRight_0.8s_ease-out]">
                {agentImg && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agentImg}
                    alt="Support Agent"
                    className="h-[280px] w-[300px] rounded-2xl object-cover shadow-2xl shadow-black/30 ring-1 ring-white/10 lg:h-[320px] lg:w-[360px]"
                  />
                )}
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-xl animate-[bounceIn_1s_ease-out_0.5s_both]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">দ্রুত রেসপন্স</p>
                    <p className="text-[10px] text-gray-500">গড়ে ৫ মিনিটের মধ্যে</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative -mt-8 px-4 pb-16 md:-mt-12">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {/* Phone Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-200">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{phoneTitle || "ফোনে যোগাযোগ"}</h3>
              <a
                href={`tel:${phoneNum?.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 text-lg font-semibold text-sky-600 transition-colors hover:text-sky-700"
              >
                {phoneNum}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="mt-2 text-sm text-gray-500">সকাল ৯টা — রাত ১১টা</p>
            </div>
          </div>

          {/* Email Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_0.5s_ease-out_0.4s_both]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-200">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{emailTitle || "ইমেইল সাপোর্ট"}</h3>
              <a href="mailto:zerospace.arc@gmail.com" className="inline-flex items-center gap-2 text-lg font-semibold text-purple-600 transition-colors hover:text-purple-700">
                zerospace.arc@gmail.com
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="mt-2 text-sm text-gray-500">২৪ ঘন্টার মধ্যে রিপ্লাই</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Why Choose Section */}
      <section className="border-y bg-gradient-to-b from-slate-50 to-white px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />কেন আমাদের সাপোর্ট সেরা
            </div>
            <h2 className="text-2xl font-black text-gray-900 md:text-3xl">আমাদের প্রতিশ্রুতি</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "⚡", title: "দ্রুত সমাধান", desc: "সর্বোচ্চ ৫ মিনিটে প্রথম রেসপন্স" },
              { icon: "🎯", title: "সঠিক গাইডেন্স", desc: "অভিজ্ঞ টিম সদস্যদের সাপোর্ট" },
              { icon: "🔄", title: "ফলো-আপ", desc: "সমস্যা সমাধান না হওয়া পর্যন্ত" },
              { icon: "💯", title: "১০০% সন্তুষ্টি", desc: "আপনার সন্তুষ্টি আমাদের লক্ষ্য" },
            ].map((item, i) => (
              <div
                key={i}
                className="group rounded-2xl border bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-3 text-3xl transition-transform duration-300 group-hover:scale-110">{item.icon}</div>
                <h4 className="mb-1 font-bold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 px-4 py-16">
        <div className="absolute inset-0">
          <div className="absolute -left-20 top-0 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl [animation-delay:1.5s]" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center text-white">
          <h2 className="mb-3 text-3xl font-black md:text-4xl">এখনও সমস্যায় আছেন?</h2>
          <p className="mb-8 text-lg text-white/70">
            চিন্তা করবেন না, আমাদের টিম সবসময় আপনাকে সাহায্য করতে প্রস্তুত
          </p>
          <a href={`tel:${phoneNum?.replace(/[^+\d]/g, "")}`}>
            <Button size="lg" className="rounded-full bg-white px-8 font-bold text-sky-700 shadow-xl transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-2xl">
              <Phone className="mr-2 h-4 w-4" />কল করুন
            </Button>
          </a>
        </div>
      </section>

      <Footer />

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.3);
          }
          50% {
            transform: translate(-50%, 0) scale(1.05);
          }
          70% {
            transform: translate(-50%, 0) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
