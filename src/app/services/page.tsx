"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from("design_services").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setServices(data ?? []);
    });
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("নাম ও ফোন নম্বর দিন"); return; }
    setSubmitting(true);
    await supabase.from("service_requests").insert({
      full_name: form.name,
      phone: form.phone,
      email: form.email || null,
      project_location: form.location || null,
      service_type: `ডিজাইন কনসালটেন্সি: ${selected?.title || "সাধারণ"}`,
      message: form.message || null,
    });
    await fetch("/api/notify-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "নতুন কনসালটেন্সি রিকোয়েস্ট",
        message: `${form.name} "${selected?.title || "সাধারণ"}" সার্ভিসের জন্য বুকিং করেছেন।`,
        type: "service",
        link: "/admin",
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: "", phone: "", email: "", location: "", message: "" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4 py-20 text-white md:py-28">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <CheckCircle className="h-4 w-4 text-sky-400" />১০০+ সফল প্রজেক্ট
            </div>
            <h1 className="mb-5 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              ডিজাইন ও<br /><span className="text-sky-400">কনসালটেন্সি সার্ভিস</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/70 md:text-lg">
              আর্কিটেকচারাল ডিজাইন, স্ট্রাকচারাল ডিজাইন, ইন্টেরিয়র ডিজাইন ও কনস্ট্রাকশন সুপারভিশন — সব একই ছাদের নিচে।
            </p>
            <Button size="lg" className="rounded-full bg-sky-500 px-8 text-base font-bold shadow-lg hover:bg-sky-600" onClick={() => { setSelected(null); setShowBooking(true); setSubmitted(false); }}>
              ফ্রি কনসালটেশন বুক করুন <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Services Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-black text-foreground">আমাদের সার্ভিসসমূহ</h2>
            <p className="text-muted-foreground">আপনার স্বপ্নের প্রজেক্ট বাস্তবায়নে আমরা আছি</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <div
                key={service.id}
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                onClick={() => { setSelected(service); setShowBooking(false); setSubmitted(false); }}
              >
                {service.image_url && (
                  <div className="h-48 overflow-hidden">
                    <Image src={service.image_url} alt={service.title} width={400} height={240} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold text-foreground">{service.title}</h3>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  {service.price && <p className="mb-3 text-sm font-semibold text-sky-600">{service.price}</p>}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:underline">
                    বিস্তারিত দেখুন <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">সার্ভিস শীঘ্রই আসছে...</p>
          )}
        </section>

        {/* Gallery */}
        <section className="px-4 py-20">
          <GallerySection />
        </section>

        {/* Spacer */}
        <div className="h-8" />

        {/* CTA */}
        <section className="bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-14">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="mb-3 text-3xl font-black">আজই কথা বলুন</h2>
            <p className="mb-6 text-white/80">আপনার প্রজেক্ট নিয়ে আলোচনা করতে এখনই কল করুন বা বুকিং দিন</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:+8801521113539">
                <Button size="lg" className="rounded-full bg-white px-8 font-bold text-sky-700 hover:bg-white/90">
                  <Phone className="mr-2 h-4 w-4" />+880 1521-113539
                </Button>
              </a>
              <Button size="lg" className="rounded-full border-2 border-white bg-transparent px-8 font-bold text-white hover:bg-white/10" onClick={() => { setSelected(null); setShowBooking(true); setSubmitted(false); }}>
                বুকিং দিন
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Service Detail Modal */}
      {selected && !showBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-4 top-4 z-10 rounded-full bg-muted p-1" onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            {selected.image_url && (
              <div className="h-52 overflow-hidden rounded-t-2xl">
                <Image src={selected.image_url} alt={selected.title} width={600} height={300} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <h2 className="mb-2 text-2xl font-black text-foreground">{selected.title}</h2>
              {selected.price && <p className="mb-3 text-lg font-bold text-sky-600">{selected.price}</p>}
              <p className="mb-4 text-sm text-muted-foreground">{selected.description}</p>
              {selected.details && (
                <div className="mb-5 whitespace-pre-line rounded-xl border bg-muted/30 p-4 text-sm text-foreground/80">{selected.details}</div>
              )}
              <Button className="w-full rounded-full bg-sky-600 hover:bg-sky-700" onClick={() => setShowBooking(true)}>
                <Send className="mr-2 h-4 w-4" />এই সার্ভিসের জন্য বুকিং দিন
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowBooking(false)}>
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-4 top-4 z-10 rounded-full bg-muted p-1" onClick={() => setShowBooking(false)}><X className="h-5 w-5" /></button>
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-5 text-white">
              <h3 className="text-lg font-bold">কনসালটেন্সি বুকিং</h3>
              <p className="text-sm text-white/80">{selected ? selected.title : "আপনার তথ্য দিন"}</p>
            </div>
            {submitted ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-bold">বুকিং সফল! 🎉</h3>
                <p className="text-sm text-muted-foreground">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3 p-6">
                <div><Label>নাম *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>ফোন *</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="০১XXXXXXXXX" /></div>
                <div><Label>ইমেইল</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>প্রজেক্ট লোকেশন</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>বিস্তারিত</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="আপনার প্রজেক্ট সম্পর্কে বলুন..." /></div>
                <Button type="submit" disabled={submitting} className="w-full rounded-full bg-sky-600 hover:bg-sky-700">
                  {submitting ? "পাঠানো হচ্ছে..." : "বুকিং কনফার্ম করুন"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function GallerySection() {
  const [images, setImages] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("design_gallery").select("*").order("sort_order").then(({ data }) => setImages(data ?? []));
  }, []);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (images.length <= 4) return;
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  // Show 4 images at a time, rotating through the list
  const doubled = [...images, ...images];
  const visible = doubled.slice(offset, offset + 4);

  return (
    <div>
      <div className="mb-10 text-center">
        <h2 className="mb-2 text-3xl font-black text-foreground">আমাদের কাজ</h2>
        <p className="text-muted-foreground">সফলভাবে সম্পন্ন কিছু প্রজেক্ট</p>
      </div>

      {/* 4-column full-frame grid */}
      <div className="mx-auto max-w-7xl">
        <div className="grid h-[350px] grid-cols-2 gap-1 overflow-hidden rounded-xl sm:h-[420px] md:grid-cols-4 md:h-[480px]">
          {visible.map((img, i) => (
            <div
              key={`${img.id}-${offset}-${i}`}
              className="group relative cursor-pointer overflow-hidden"
              onClick={() => setLightbox(img.image_url)}
            >
              <Image
                src={img.image_url}
                alt={img.title || ""}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
              <div className="absolute inset-0 bg-black/5 transition-all group-hover:bg-black/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-6 top-6 text-white" onClick={() => setLightbox(null)}><X className="h-8 w-8" /></button>
          <Image src={lightbox} alt="" width={1200} height={800} className="max-h-[90vh] max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
