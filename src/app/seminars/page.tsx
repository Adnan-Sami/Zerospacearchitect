"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Calendar, X, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Seminar = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_upcoming: boolean;
  is_active: boolean;
  sort_order: number;
  deadline: string | null;
};

export default function SeminarsPage() {
  const [upcoming, setUpcoming] = useState<Seminar[]>([]);
  const [past, setPast] = useState<Seminar[]>([]);
  const [selected, setSelected] = useState<Seminar | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    supabase
      .from("seminars")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const all = (data as Seminar[]) ?? [];
        const now = new Date();
        // Auto-categorize: if deadline has passed, treat as past regardless of is_upcoming flag
        const upcomingList = all.filter((s) => {
          if (!s.is_upcoming) return false;
          if (s.deadline && new Date(s.deadline) < now) return false;
          return true;
        });
        const pastList = all.filter((s) => {
          if (!s.is_upcoming) return true;
          if (s.deadline && new Date(s.deadline) < now) return true;
          return false;
        });
        setUpcoming(upcomingList);
        setPast(pastList);
      });
  }, []);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("নাম ও ফোন নম্বর দিন");
      return;
    }
    setSubmitting(true);
    await supabase.from("seminar_registrations").insert({
      seminar_id: selected?.id,
      seminar_title: selected?.title,
      name: form.name,
      phone: form.phone,
      email: form.email || null,
    });
    await fetch("/api/notify-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "নতুন সেমিনার রেজিস্ট্রেশন",
        message: `${form.name} "${selected?.title}" সেমিনারে যোগ দিতে চান।`,
        type: "seminar",
        link: "/admin/seminars",
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: "", phone: "", email: "" });
  };

  const openDetail = (seminar: Seminar) => {
    setSelected(seminar);
    setShowForm(false);
    setSubmitted(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[400px] w-[400px] animate-pulse rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] animate-pulse rounded-full bg-blue-500/10 blur-3xl [animation-delay:1s]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-sky-400" />
            <span className="text-white/80">লাইভ সেমিনার ও ওয়েবিনার</span>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl">
            সেমিনার ও ওয়েবিনার
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/60 md:text-lg">
            আমাদের ফ্রি ও প্রিমিয়াম সেমিনারে অংশ নিন। ইন্ডাস্ট্রি এক্সপার্টদের কাছ থেকে সরাসরি শিখুন।
          </p>
        </div>
      </section>

      {/* Upcoming Seminars */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 py-16 text-center">
            <p className="text-lg font-semibold text-sky-600">কোন নতুন সেমিনার নেই</p>
            <p className="mt-2 text-sm text-muted-foreground">শীঘ্রই নতুন সেমিনার আসছে, চোখ রাখুন!</p>
          </div>
        ) : (
          <div>
            <h2 className="mb-8 text-2xl font-black text-gray-900">আসন্ন সেমিনার</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((seminar) => (
                <div key={seminar.id} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {seminar.image_url ? (
                      <Image src={seminar.image_url} alt={seminar.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-4 min-h-[48px] text-sm font-semibold text-gray-900 line-clamp-3">{seminar.title}</h3>
                    <Button className="w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-700" onClick={() => openDetail(seminar)}>
                      দেখুন
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Past Seminars */}
      {past.length > 0 && (
        <section className="border-t bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="whitespace-nowrap text-xl font-black text-gray-900">পূর্ববর্তী লাইভ ওয়েবিনার</h2>
              <div className="h-px flex-1 bg-gray-300" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((seminar) => (
                <div key={seminar.id} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {seminar.image_url ? (
                      <Image src={seminar.image_url} alt={seminar.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-4 min-h-[48px] text-sm font-semibold text-gray-900 line-clamp-3">{seminar.title}</h3>
                    {seminar.link_url ? (
                      <a href={seminar.link_url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-700">দেখুন</Button>
                      </a>
                    ) : (
                      <Button className="w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-700" disabled>দেখুন</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seminar Detail Popup (Upcoming only) */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 z-10 rounded-full bg-gray-100 p-1.5 hover:bg-gray-200" onClick={() => setSelected(null)}>
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            {selected.image_url && (
              <div className="relative h-48 w-full overflow-hidden">
                <Image src={selected.image_url} alt={selected.title} fill className="object-cover" />
              </div>
            )}

            <div className="p-6">
              <h3 className="mb-2 text-xl font-bold text-gray-900">{selected.title}</h3>
              {selected.description && (
                <p className="mb-4 whitespace-pre-line text-sm text-gray-600">{selected.description}</p>
              )}
              {selected.deadline && (
                <p className="mb-4 text-xs font-medium text-orange-600">
                  ⏰ রেজিস্ট্রেশন শেষ: {new Date(selected.deadline).toLocaleString("bn-BD")}
                </p>
              )}

              {/* Join Form or Thank You */}
              {(() => {
                const deadlinePassed = selected.deadline && new Date(selected.deadline) < new Date();
                if (deadlinePassed) {
                  return (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                      <p className="font-semibold text-red-600">রেজিস্ট্রেশনের সময় শেষ হয়ে গেছে</p>
                      <p className="mt-1 text-xs text-red-500">এই সেমিনারে আর যোগ দেওয়া যাবে না।</p>
                    </div>
                  );
                }
                if (submitted) {
                  return (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                      <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                      <h4 className="mb-1 text-lg font-bold text-green-700">ধন্যবাদ! 🎉</h4>
                      <p className="text-sm text-green-600">আপনার রেজিস্ট্রেশন সফল হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                    </div>
                  );
                }
                if (showForm) {
                  return (
                    <form onSubmit={handleJoinSubmit} className="space-y-3">
                      <div><Label>নাম *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                      <div><Label>ফোন *</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="০১XXXXXXXXX" /></div>
                      <div><Label>ইমেইল</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                      <Button type="submit" disabled={submitting} className="w-full rounded-full bg-green-600 font-semibold hover:bg-green-700">
                        {submitting ? "জমা হচ্ছে..." : <><Send className="mr-2 h-4 w-4" />রেজিস্ট্রেশন কনফার্ম করুন</>}
                      </Button>
                    </form>
                  );
                }
                return (
                  <Button className="w-full rounded-full bg-blue-600 text-base font-bold hover:bg-blue-700" onClick={() => setShowForm(true)}>
                    Join Now
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
