"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

export default function BookDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", project_location: "", message: "" });

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data } = await supabase.from("books").select("*").eq("slug", slug).eq("is_published", true).single();
      setBook(data ?? null);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert([
      {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        project_location: form.project_location || null,
        service_type: `বই অর্ডার: ${book.title}`,
        message: `বই: ${book.title} | দাম: ৳${Number(book.price).toLocaleString("bn-BD")}\n${form.message}`,
      },
    ]);
    setSubmitting(false);
    if (error) {
      toast.error("অর্ডার ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      return;
    }
    toast.success("অর্ডার সফল হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
    setForm({ full_name: "", phone: "", email: "", project_location: "", message: "" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50/40">
        {loading ? (
          <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে...</div>
        ) : !book ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <p className="mb-4 text-lg font-semibold">বইটি পাওয়া যায়নি</p>
            <Link href="/books">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />বই তালিকায় ফিরে যান</Button>
            </Link>
          </div>
        ) : (
          <>
            <section className="px-4 py-8 md:px-8 md:py-10">
              <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <div className="relative aspect-3/4 overflow-hidden rounded-[1.5rem] bg-slate-100">
                    <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="(min-width: 1024px) 35vw, 100vw" priority />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-8">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700">
                    <BookOpen className="h-4 w-4" />বইয়ের বিস্তারিত
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{book.title}</h1>
                  <p className="mt-3 text-base font-medium text-slate-600">লেখক: {book.author || "—"}</p>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-5 w-5 ${index < Number(book.rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-end gap-3">
                    <span className="text-3xl font-black text-sky-600">৳{Number(book.price).toLocaleString("bn-BD")}</span>
                    {book.original_price && Number(book.original_price) > Number(book.price) && (
                      <span className="pb-1 text-base text-slate-400 line-through">৳{Number(book.original_price).toLocaleString("bn-BD")}</span>
                    )}
                  </div>
                  <p className="mt-6 text-base leading-8 text-slate-700">{book.description}</p>
                  <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                    <h2 className="mb-3 text-lg font-bold text-slate-900">বইয়ের বিস্তারিত</h2>
                    <p className="whitespace-pre-line leading-8 text-slate-700">{book.details || "অতিরিক্ত বিস্তারিত এখানে দেখানো হবে।"}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-4 pb-14 md:px-8">
              <div className="mx-auto max-w-7xl">
                <Card className="overflow-hidden border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <CardTitle className="text-xl">এই বই অর্ডার করুন</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleOrder} className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="full_name">পূর্ণ নাম *</Label>
                        <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="phone">মোবাইল নম্বর *</Label>
                        <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="email">ইমেইল</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="project_location">ডেলিভারি ঠিকানা</Label>
                        <Input id="project_location" value={form.project_location} onChange={(e) => setForm({ ...form, project_location: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="message">বার্তা</Label>
                        <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} />
                      </div>
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={submitting} className="rounded-full bg-sky-600 px-6 font-semibold text-white shadow-[0_10px_24px_rgba(2,132,199,0.26)] hover:bg-sky-700">
                          <ShoppingCart className="mr-2 h-4 w-4" />{submitting ? "অর্ডার হচ্ছে..." : "অর্ডার করুন"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
