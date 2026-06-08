"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Star, ShoppingCart, ArrowLeft, FileText, Truck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { toast } from "sonner";

export default function BookDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", address: "", message: "", transaction_id: "", payment_method: "bkash" });
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const siteSettings = useSiteSettings();

  // Coupon calculation
  const originalPrice = Number(book?.price ?? 0);
  const discount = couponApplied
    ? couponApplied.discount_type === "percent"
      ? Math.round(originalPrice * (couponApplied.discount_value / 100))
      : Math.min(Number(couponApplied.discount_value), originalPrice)
    : 0;
  const finalPrice = Math.max(originalPrice - discount, 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!data) { setCouponError("এই কুপন কোড বৈধ নয়।"); setCouponApplied(null); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError("কুপনের মেয়াদ শেষ।"); setCouponApplied(null); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { setCouponError("কুপনের সীমা শেষ।"); setCouponApplied(null); return; }
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
          return;
        }
      }
    }
    setCouponApplied(data);
  };

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      
      // Try by slug first
      let { data } = await supabase.from("books").select("*").eq("slug", slug).eq("is_published", true).limit(1).maybeSingle();
      
      // If not found by slug, try by id (in case slug is actually a UUID)
      if (!data) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
          const res = await supabase.from("books").select("*").eq("id", slug).eq("is_published", true).limit(1).maybeSingle();
          data = res.data;
        }
      }

      // If still not found, try decoded slug
      if (!data) {
        const decoded = decodeURIComponent(slug);
        if (decoded !== slug) {
          const res = await supabase.from("books").select("*").eq("slug", decoded).eq("is_published", true).limit(1).maybeSingle();
          data = res.data;
        }
      }

      setBook(data ?? null);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleHardcopyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setSubmitting(true);

    // Check if logged in (optional for hardcopy)
    const { data: { session } } = await supabase.auth.getSession();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("book_orders").insert({
      user_id: session?.user?.id || null,
      book_id: book.id,
      amount: finalPrice,
      payment_phone: form.phone,
      transaction_id: form.transaction_id,
      payment_method: form.payment_method,
      customer_name: form.full_name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      delivery_address: form.address || null,
      order_note: form.message || null,
      invoice_number: invoiceNumber,
      coupon_code: couponApplied?.code || null,
    });

    if (!error) {
      // Increment coupon usage
      if (couponApplied) {
        await fetch("/api/coupon-used", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: couponApplied.id }),
        });
      }
      // Notify via server API
      await fetch("/api/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "নতুন বই অর্ডার",
          message: `"${book.title}" বইয়ের নতুন অর্ডার। গ্রাহক: ${form.full_name}`,
          type: "book_order",
          link: "/admin/orders",
          userId: session?.user?.id || null,
          userTitle: session ? "বই অর্ডার সাবমিট হয়েছে" : null,
          userMessage: session ? `"${book.title}" বইয়ের অর্ডার পেন্ডিং আছে।` : null,
          userLink: "/dashboard",
        }),
      });

      // Show invoice
      setInvoice({
        number: invoiceNumber,
        date: new Date().toLocaleDateString("bn-BD"),
        bookTitle: book.title,
        price: finalPrice,
        customerName: form.full_name,
        phone: form.phone,
        address: form.address,
        transactionId: form.transaction_id,
      });
      setShowOrderForm(false);
    } else {
      toast.error("অর্ডার ব্যর্থ হয়েছে।");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 py-20 text-center text-muted-foreground">লোড হচ্ছে...</div>
      <Footer />
    </div>
  );

  if (!book) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 py-20 text-center">
        <p className="text-lg font-semibold">বইটি পাওয়া যায়নি</p>
        <Link href="/books" className="mt-4 inline-block">
          <Button variant="outline"><ArrowLeft className="mr-1 h-4 w-4" />বই তালিকায় ফিরুন</Button>
        </Link>
      </div>
      <Footer />
    </div>
  );

  const isPDF = book.book_type === "pdf";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          {/* Breadcrumb */}
          <Link href="/books" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sky-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> বই তালিকা
          </Link>

          {/* Main layout */}
          <div className="flex gap-6 sm:gap-8 lg:gap-10">
            {/* Left: Cover */}
            <div className="shrink-0 md:sticky md:top-24 md:self-start">
              <div className="w-36 overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:w-44 md:w-52 lg:w-56">
                {book.cover_url ? (
                  <Image src={book.cover_url} alt={book.title} width={448} height={640} className="h-auto w-full" priority />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-sky-50"><BookOpen className="h-10 w-10 text-sky-200" /></div>
                )}
              </div>
            </div>

            {/* Right: Content */}
            <div className="min-w-0 flex-1 py-1">
              {/* Badge + Title */}
              <div className="mb-1">
                <Badge className="mb-2 bg-sky-100 text-sky-700 hover:bg-sky-100">
                  {isPDF ? <><FileText className="mr-1 h-3 w-3" />PDF</> : <><Truck className="mr-1 h-3 w-3" />হার্ডকপি</>}
                </Badge>
              </div>
              <h1 className="mb-1 text-xl font-black leading-tight text-foreground sm:text-2xl md:text-3xl">
                {book.title}
              </h1>
              <p className="mb-3 text-sm text-muted-foreground">{book.author || "—"}</p>

              {/* Rating */}
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < book.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                ))}
                <span className="ml-1 text-xs text-muted-foreground">({book.rating}/5)</span>
              </div>

              {/* Price */}
              <div className="mb-5 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-sky-600 sm:text-3xl">
                  ৳{Number(book.price).toLocaleString("bn-BD")}
                </span>
                {book.original_price && Number(book.original_price) > Number(book.price) && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ৳{Number(book.original_price).toLocaleString("bn-BD")}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                      {Math.round((1 - Number(book.price) / Number(book.original_price)) * 100)}% ছাড়
                    </span>
                  </>
                )}
              </div>

              {/* Short description */}
              {book.description && (
                <p className="mb-3 text-sm leading-relaxed text-foreground/80">{book.description}</p>
              )}
            </div>
          </div>

          {/* Details section — full width below */}
          {book.details && (
            <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="mb-3 text-base font-bold text-foreground">বইয়ের বিস্তারিত</h3>
              <div className="whitespace-pre-line text-sm leading-7 text-foreground/80">{book.details}</div>
            </div>
          )}

          {/* CTA Button — after details */}
          <div className="mt-6">
            {!showOrderForm && (
              <Button
                size="lg"
                className="w-full rounded-full bg-sky-600 px-8 font-semibold shadow-[0_10px_24px_rgba(2,132,199,0.26)] hover:bg-sky-700"
                onClick={() => setShowOrderForm(true)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isPDF ? "PDF কিনুন" : "অর্ডার করুন"}
              </Button>
            )}
          </div>

          {/* Order form — full width below */}
          {showOrderForm && (
            <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="border-b bg-sky-50 px-5 py-3">
                <h3 className="font-bold text-foreground">
                  {isPDF ? "PDF বই কিনুন" : "হার্ডকপি অর্ডার করুন"}
                </h3>
                <p className="text-xs text-muted-foreground">পেমেন্ট করে তথ্য দিন। অ্যাডমিন অ্যাপ্রুভ করলে অ্যাক্সেস পাবেন।</p>
              </div>
              <form onSubmit={handleHardcopyOrder} className="space-y-4 p-5">
                {/* Payment method selection */}
                <div>
                  <Label className="mb-2 block">পেমেন্ট মাধ্যম নির্বাচন করুন</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "bkash", label: "বিকাশ", logo: "/bkash_logo_0.webp", color: "border-pink-400 bg-pink-50" },
                      { id: "nagad", label: "নগদ", logo: "/nagad.webp", color: "border-orange-400 bg-orange-50" },
                      { id: "rocket", label: "রকেট", logo: "/unnamed (1).png", color: "border-purple-400 bg-purple-50" },
                    ].map((m) => (
                      <button key={m.id} type="button" onClick={() => setForm({ ...form, payment_method: m.id })}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${form.payment_method === m.id ? m.color + " shadow-md scale-[1.02]" : "border-border hover:border-muted-foreground/30"}`}>
                        <img src={m.logo} alt={m.label} className="h-8 w-auto object-contain" />
                        <span className={`text-xs font-semibold ${form.payment_method === m.id ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment number display */}
                <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">এই নম্বরে ৳{finalPrice.toLocaleString("bn-BD")} পাঠান:</p>
                  <p className="text-xl font-bold text-foreground">
                    {form.payment_method === "bkash" && (siteSettings.bkash_number || "নম্বর সেট করা হয়নি")}
                    {form.payment_method === "nagad" && (siteSettings.nagad_number || "নম্বর সেট করা হয়নি")}
                    {form.payment_method === "rocket" && (siteSettings.rocket_number || "নম্বর সেট করা হয়নি")}
                  </p>
                  <p className="mt-1 text-xs text-sky-600 font-medium">
                    {form.payment_method === "bkash" ? "বিকাশ" : form.payment_method === "nagad" ? "নগদ" : "রকেট"} পার্সোনাল নম্বর
                  </p>
                </div>

                {/* Personal info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>পূর্ণ নাম *</Label>
                    <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>মোবাইল নম্বর *</Label>
                    <div className="flex">
                      <div className="flex items-center gap-1.5 rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                        <svg width="20" height="14" viewBox="0 0 20 14" className="shrink-0">
                          <rect width="20" height="14" fill="#006a4e"/>
                          <circle cx="9" cy="7" r="4" fill="#f42a41"/>
                        </svg>
                        <span>+88</span>
                      </div>
                      <Input
                        required
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
                          setForm({ ...form, phone: val });
                        }}
                        placeholder="01XXXXXXXXX"
                        maxLength={11}
                        minLength={11}
                        pattern="[0-9]{11}"
                        title="১১ ডিজিটের মোবাইল নম্বর দিন"
                        className="rounded-l-none"
                      />
                    </div>
                    {form.phone && form.phone.length < 11 && (
                      <p className="mt-1 text-xs text-amber-600">১১ ডিজিট প্রয়োজন ({form.phone.length}/১১)</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{form.payment_method === "bkash" ? "বিকাশ" : form.payment_method === "nagad" ? "নগদ" : "রকেট"} নম্বরের শেষ ৪ ডিজিট *</Label>
                    <Input
                      required
                      value={form.transaction_id}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                        setForm({ ...form, transaction_id: val });
                      }}
                      placeholder="যেমন: 1234"
                      maxLength={4}
                      minLength={4}
                      pattern="[0-9]{4}"
                      title="৪ ডিজিট দিন"
                    />
                    {form.transaction_id && form.transaction_id.length < 4 && (
                      <p className="mt-1 text-xs text-amber-600">৪ ডিজিট প্রয়োজন ({form.transaction_id.length}/৪)</p>
                    )}
                  </div>
                  <div>
                    <Label>ইমেইল</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>ডেলিভারি ঠিকানা {!isPDF && "*"}</Label>
                  <Input required={!isPDF} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="সম্পূর্ণ ঠিকানা লিখুন" />
                </div>
                <div>
                  <Label>বার্তা (ঐচ্ছিক)</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} />
                </div>

                {/* Coupon */}
                <div>
                  <Label>কুপন কোড (ঐচ্ছিক)</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input placeholder="কুপন কোড" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }} disabled={!!couponApplied} className="flex-1" />
                    {couponApplied ? (
                      <Button type="button" variant="outline" className="shrink-0 text-red-600" onClick={() => { setCouponApplied(null); setCouponCode(""); }}>সরান</Button>
                    ) : (
                      <Button type="button" variant="outline" className="shrink-0" onClick={applyCoupon} disabled={!couponCode.trim()}>প্রয়োগ</Button>
                    )}
                  </div>
                  {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
                  {couponApplied && (
                    <p className="mt-1 text-xs text-green-600">✅ কুপন প্রয়োগ হয়েছে! ডিসকাউন্ট: ৳{discount} — মোট: ৳{finalPrice}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-full bg-sky-600 hover:bg-sky-700">
                    {submitting ? "অর্ডার হচ্ছে..." : `অর্ডার কনফার্ম করুন — ৳${finalPrice.toLocaleString("bn-BD")}`}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowOrderForm(false)}>বাতিল</Button>
                </div>
              </form>
            </div>
          )}
          {/* Invoice display after successful order */}
          {invoice && (
            <div className="mt-6">
              {/* Success message - hidden in print */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 print:hidden">
                <div>
                  <h3 className="font-bold text-green-800">✅ অর্ডার সফল হয়েছে!</h3>
                  <p className="text-xs text-green-700">ইনভয়েস নিচে দেখুন ও ডাউনলোড করুন</p>
                </div>
                <Button size="sm" onClick={() => {
                  const printContent = document.getElementById("invoice-content")?.innerHTML;
                  if (!printContent) return;
                  const win = window.open("", "_blank");
                  if (!win) return;
                  win.document.write(`
                    <html>
                    <head>
                      <title>Invoice - ${invoice.number}</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
                        .invoice-box { max-width: 700px; margin: auto; border: 2px solid #0284c7; border-radius: 12px; overflow: hidden; }
                        .invoice-header { background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 30px; }
                        .invoice-header h1 { font-size: 24px; font-weight: 800; }
                        .invoice-header p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
                        .invoice-meta { display: flex; justify-content: space-between; padding: 20px 30px; background: #f0f9ff; border-bottom: 1px solid #e0f2fe; }
                        .invoice-meta .left, .invoice-meta .right { }
                        .invoice-meta .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                        .invoice-meta .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
                        .invoice-body { padding: 30px; }
                        .section-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
                        .info-item .label { font-size: 11px; color: #94a3b8; }
                        .info-item .value { font-size: 14px; font-weight: 500; margin-top: 2px; }
                        .book-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
                        .book-name { font-size: 16px; font-weight: 700; }
                        .book-price { font-size: 22px; font-weight: 800; color: #0284c7; }
                        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #e2e8f0; margin-top: 16px; }
                        .total-label { font-size: 14px; font-weight: 600; }
                        .total-value { font-size: 24px; font-weight: 800; color: #0284c7; }
                        .footer { text-align: center; padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #fef9c3; color: #a16207; }
                      </style>
                    </head>
                    <body>
                      <div class="invoice-box">
                        <div class="invoice-header">
                          <h1>Zero Space Architect</h1>
                          <p>বই অর্ডার ইনভয়েস</p>
                        </div>
                        <div class="invoice-meta">
                          <div class="left">
                            <div class="label">ইনভয়েস নং</div>
                            <div class="value">${invoice.number}</div>
                          </div>
                          <div class="right" style="text-align:right">
                            <div class="label">তারিখ</div>
                            <div class="value">${invoice.date}</div>
                          </div>
                        </div>
                        <div class="invoice-body">
                          <div class="info-grid">
                            <div>
                              <div class="section-title">গ্রাহক তথ্য</div>
                              <div class="info-item"><div class="label">নাম</div><div class="value">${invoice.customerName}</div></div>
                              <div class="info-item" style="margin-top:8px"><div class="label">ফোন</div><div class="value">${invoice.phone}</div></div>
                              ${invoice.address ? `<div class="info-item" style="margin-top:8px"><div class="label">ঠিকানা</div><div class="value">${invoice.address}</div></div>` : ""}
                            </div>
                            <div>
                              <div class="section-title">পেমেন্ট তথ্য</div>
                              <div class="info-item"><div class="label">ট্রানজেকশন আইডি</div><div class="value">${invoice.transactionId}</div></div>
                              <div class="info-item" style="margin-top:8px"><div class="label">স্ট্যাটাস</div><div class="value"><span class="status-badge">পেন্ডিং</span></div></div>
                            </div>
                          </div>
                          <div class="section-title">অর্ডার আইটেম</div>
                          <div class="book-row">
                            <div class="book-name">${invoice.bookTitle}</div>
                            <div class="book-price">৳${invoice.price.toLocaleString("bn-BD")}</div>
                          </div>
                          <div class="total-row">
                            <div class="total-label">সর্বমোট</div>
                            <div class="total-value">৳${invoice.price.toLocaleString("bn-BD")}</div>
                          </div>
                        </div>
                        <div class="footer">
                          ধন্যবাদ আপনার অর্ডারের জন্য! অ্যাডমিন যাচাই করে অ্যাপ্রুভ করবে।
                        </div>
                      </div>
                    </body>
                    </html>
                  `);
                  win.document.close();
                  win.print();
                }}>
                  <Download className="mr-1 h-3 w-3" />ইনভয়েস প্রিন্ট
                </Button>
              </div>

              {/* Inline invoice preview */}
              <div id="invoice-content" className="overflow-hidden rounded-2xl border shadow-sm">
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-5 text-white">
                  <h2 className="text-xl font-bold">Zero Space Architect</h2>
                  <p className="text-xs text-sky-100">বই অর্ডার ইনভয়েস</p>
                </div>
                <div className="flex items-center justify-between border-b bg-sky-50 px-6 py-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">ইনভয়েস নং: </span>
                    <span className="font-mono font-bold">{invoice.number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">তারিখ: </span>
                    <span className="font-medium">{invoice.date}</span>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">গ্রাহক তথ্য</p>
                      <p className="font-semibold text-sm">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.phone}</p>
                      {invoice.address && <p className="text-xs text-muted-foreground">{invoice.address}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">পেমেন্ট</p>
                      <p className="text-xs text-muted-foreground">ট্রানজেকশন: <span className="font-mono font-medium text-foreground">{invoice.transactionId}</span></p>
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800">পেন্ডিং</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">বই</p>
                        <p className="font-bold text-foreground">{invoice.bookTitle}</p>
                      </div>
                      <p className="text-2xl font-extrabold text-sky-600">৳{invoice.price.toLocaleString("bn-BD")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="font-semibold text-sm">সর্বমোট</span>
                    <span className="text-xl font-extrabold text-sky-600">৳{invoice.price.toLocaleString("bn-BD")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
