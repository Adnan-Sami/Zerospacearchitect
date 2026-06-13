"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toBn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { validateCoupon } from "@/lib/coupon-validation";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteSettings = useSiteSettings();
  const [course, setCourse] = useState<any>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      if (!data) return;

      // Free course — auto-enroll and redirect
      if (Number(data.price) === 0) {
        setLoading(true);
        await supabase.from("enrollments").insert({
          user_id: session.user.id,
          course_id: courseId,
        });
        router.push(`/learn/${courseId}`);
        return;
      }

      setCourse(data);
    });
  }, [courseId, router]);

  // Auto-apply coupon from URL
  useEffect(() => {
    const couponParam = searchParams.get("coupon");
    if (couponParam && !couponApplied && courseId) {
      setCouponCode(couponParam.toUpperCase());
      setTimeout(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const result = await validateCoupon(supabase, couponParam, {
          type: "course",
          itemId: courseId,
          userId: user?.id,
        });
        if (result.ok) setCouponApplied(result.coupon);
      }, 500);
    }
  }, [searchParams, courseId]);

  // Calculate final price with coupon
  const originalPrice = Number(course?.price ?? 0);
  const discount = couponApplied
    ? couponApplied.discount_type === "percent"
      ? Math.round(originalPrice * (couponApplied.discount_value / 100))
      : Math.min(couponApplied.discount_value, originalPrice)
    : 0;
  const finalPrice = Math.max(originalPrice - discount, 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setApplyingCoupon(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const result = await validateCoupon(supabase, couponCode, {
      type: "course",
      itemId: courseId,
      userId: user?.id,
    });

    if (!result.ok) {
      setCouponError(result.error);
      setCouponApplied(null);
      setApplyingCoupon(false);
      return;
    }

    setCouponApplied(result.coupon);
    setApplyingCoupon(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("লগ-ইন করুন।");
      setLoading(false);
      return;
    }

    const { error: orderError } = await supabase.from("orders").insert({
      user_id: user.id,
      course_id: courseId,
      amount: finalPrice,
      payment_phone: paymentPhone,
      transaction_id: transactionId,
      payment_method: paymentMethod,
      coupon_code: couponApplied?.code || null,
    });

    if (orderError) {
      setError("অর্ডার সাবমিট করতে সমস্যা হয়েছে।");
    } else {
      // Increment coupon usage if applied
      if (couponApplied) {
        await fetch("/api/coupon-used", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: couponApplied.id }),
        });
      }
      // Notify user + admins via server API (bypasses RLS)
      await fetch("/api/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "নতুন অর্ডার এসেছে",
          message: `${course.title} কোর্সের নতুন অর্ডার।`,
          type: "order",
          link: "/admin/orders",
          userId: user.id,
          userTitle: "অর্ডার সাবমিট হয়েছে",
          userMessage: `"${course.title}" কোর্সের অর্ডার পেন্ডিং আছে। অ্যাডমিন অ্যাপ্রুভ করলে কোর্স পাবেন।`,
          userLink: "/dashboard",
        }),
      });

      setSuccess(true);
    }
    setLoading(false);
  };

  if (!course)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 py-20 text-center text-muted-foreground">
          {loading ? "এনরোল হচ্ছে, অপেক্ষা করুন..." : "লোড হচ্ছে..."}
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        {success ? (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-8 py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 shadow-lg shadow-green-200/50">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-black text-gray-900">
                অর্ডার সাবমিট হয়েছে! 🎉
              </h2>
              <p className="text-sm text-gray-600">
                অ্যাডমিন আপনার পেমেন্ট যাচাই করে অ্যাপ্রুভ করবে।
                <br />
                অ্যাপ্রুভ হলে কোর্স অ্যাক্সেস পাবেন।
              </p>
            </div>
            <div className="px-8 py-6 text-center">
              <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-sm font-medium text-sky-800">
                  📋 অর্ডার স্ট্যাটাস ট্র্যাক করতে ড্যাশবোর্ড ভিজিট করুন
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="rounded-full bg-sky-600 px-8 font-bold shadow-lg hover:bg-sky-700"
                  onClick={() => router.push("/dashboard")}
                >
                  ড্যাশবোর্ডে যান
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8"
                  onClick={() => router.push("/")}
                >
                  হোমে ফিরে যান
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 text-center">
              <CardTitle className="text-xl">পেমেন্ট করুন</CardTitle>
              <CardDescription>
                {course.title} —{" "}
                <span className="font-bold text-sky-600">
                  ৳{finalPrice.toLocaleString("bn-BD")}
                </span>
                {discount > 0 && (
                  <span className="ml-2 text-xs text-green-600">
                    (৳{discount} ছাড়)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Payment instruction */}
              <div className="mb-6 rounded-xl bg-sky-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-sky-700">
                  পেমেন্ট নির্দেশনা:
                </h3>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>
                    নিচের যেকোনো নম্বরে{" "}
                    <strong className="text-foreground">
                      ৳{finalPrice.toLocaleString("bn-BD")}
                    </strong>{" "}
                    পাঠান
                  </li>
                  <li>
                    আপনার ফোন নম্বর ও পেমেন্ট নম্বরের শেষ ৪ ডিজিট নিচে সাবমিট
                    করুন
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                {/* Payment method with logos */}
                <div>
                  <Label className="mb-2 block">
                    পেমেন্ট মাধ্যম নির্বাচন করুন
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "bkash",
                        label: "বিকাশ",
                        logo: "/bkash_logo_0.webp",
                        color: "border-pink-400 bg-pink-50",
                      },
                      {
                        id: "nagad",
                        label: "নগদ",
                        logo: "/nagad.webp",
                        color: "border-orange-400 bg-orange-50",
                      },
                      {
                        id: "rocket",
                        label: "রকেট",
                        logo: "/unnamed (1).png",
                        color: "border-purple-400 bg-purple-50",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                          paymentMethod === m.id
                            ? m.color + " shadow-md scale-[1.02]"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <img
                          src={m.logo}
                          alt={m.label}
                          className="h-8 w-auto object-contain"
                        />
                        <span
                          className={`text-xs font-semibold ${paymentMethod === m.id ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show payment number based on selection */}
                <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    এই নম্বরে পেমেন্ট করুন:
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {paymentMethod === "bkash" &&
                      (siteSettings.bkash_number || "নম্বর সেট করা হয়নি")}
                    {paymentMethod === "nagad" &&
                      (siteSettings.nagad_number || "নম্বর সেট করা হয়নি")}
                    {paymentMethod === "rocket" &&
                      (siteSettings.rocket_number || "নম্বর সেট করা হয়নি")}
                  </p>
                  <p className="mt-1 text-xs text-sky-600 font-medium">
                    {paymentMethod === "bkash"
                      ? "বিকাশ"
                      : paymentMethod === "nagad"
                        ? "নগদ"
                        : "রকেট"}{" "}
                    পার্সোনাল নম্বর
                  </p>
                </div>

                {/* Coupon Code */}
                <div>
                  <Label>কুপন কোড (ঐচ্ছিক)</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      placeholder="কুপন কোড লিখুন"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      disabled={!!couponApplied}
                      className="flex-1"
                    />
                    {couponApplied ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 text-red-600"
                        onClick={() => {
                          setCouponApplied(null);
                          setCouponCode("");
                        }}
                      >
                        সরান
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || applyingCoupon}
                      >
                        {applyingCoupon ? "..." : "প্রয়োগ"}
                      </Button>
                    )}
                  </div>
                  {couponError && (
                    <p className="mt-1 text-sm text-red-600">{couponError}</p>
                  )}
                  {couponApplied && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ কুপন প্রয়োগ হয়েছে! ৳{discount.toLocaleString("bn-BD")}{" "}
                      ছাড়
                    </p>
                  )}
                </div>

                {/* Phone & Last 4 digits */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>আপনার ফোন নম্বর *</Label>
                    <div className="flex">
                      <div className="flex items-center gap-1.5 rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                        <svg
                          width="20"
                          height="14"
                          viewBox="0 0 20 14"
                          className="shrink-0"
                        >
                          <rect width="20" height="14" fill="#006a4e" />
                          <circle cx="9" cy="7" r="4" fill="#f42a41" />
                        </svg>
                        <span>+88</span>
                      </div>
                      <Input
                        placeholder="01XXXXXXXXX"
                        value={paymentPhone}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 11);
                          setPaymentPhone(val);
                        }}
                        required
                        maxLength={11}
                        minLength={11}
                        pattern="[0-9]{11}"
                        title="১১ ডিজিটের মোবাইল নম্বর দিন"
                        className="rounded-l-none"
                      />
                    </div>
                    {paymentPhone && paymentPhone.length < 11 && (
                      <p className="mt-1 text-xs text-amber-600">
                        ১১ ডিজিট প্রয়োজন ({toBn(paymentPhone.length)}/১১)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      {paymentMethod === "bkash"
                        ? "বিকাশ"
                        : paymentMethod === "nagad"
                          ? "নগদ"
                          : "রকেট"}{" "}
                      নম্বরের শেষ ৪ ডিজিট *
                    </Label>
                    <Input
                      placeholder="যেমন: 1234"
                      value={transactionId}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 4);
                        setTransactionId(val);
                      }}
                      required
                      maxLength={4}
                      minLength={4}
                      pattern="[0-9]{4}"
                      title="৪ ডিজিট দিন"
                    />
                    {transactionId && transactionId.length < 4 && (
                      <p className="mt-1 text-xs text-amber-600">
                        ৪ ডিজিট প্রয়োজন ({toBn(transactionId.length)}/৪)
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-sky-600 py-3 text-base font-semibold shadow-lg hover:bg-sky-700"
                  disabled={loading}
                >
                  {loading
                    ? "সাবমিট হচ্ছে..."
                    : `অর্ডার সাবমিট করুন — ৳${finalPrice.toLocaleString("bn-BD")}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
