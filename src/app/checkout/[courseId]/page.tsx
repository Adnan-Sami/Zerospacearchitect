"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const siteSettings = useSiteSettings();
  const [course, setCourse] = useState<any>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
      amount: Number(course.price),
      payment_phone: paymentPhone,
      transaction_id: transactionId,
      payment_method: paymentMethod,
    });

    if (orderError) {
      setError("অর্ডার সাবমিট করতে সমস্যা হয়েছে।");
    } else {
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
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4 text-4xl">✅</div>
              <h2 className="mb-2 text-xl font-bold">অর্ডার সাবমিট হয়েছে!</h2>
              <p className="mb-4 text-muted-foreground">
                অ্যাডমিন আপনার পেমেন্ট যাচাই করে অ্যাপ্রুভ করবে। অ্যাপ্রুভ হলে কোর্স
                অ্যাক্সেস পাবেন।
              </p>
              <Button onClick={() => router.push("/")}>হোমে ফিরে যান</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 text-center">
              <CardTitle className="text-xl">পেমেন্ট করুন</CardTitle>
              <CardDescription>
                {course.title} — <span className="font-bold text-sky-600">৳{Number(course.price).toLocaleString("bn-BD")}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Payment instruction */}
              <div className="mb-6 rounded-xl bg-sky-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-sky-700">পেমেন্ট নির্দেশনা:</h3>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>নিচের যেকোনো নম্বরে <strong className="text-foreground">৳{Number(course.price).toLocaleString("bn-BD")}</strong> পাঠান</li>
                  <li>ট্রানজেকশন আইডি ও ফোন নম্বর নিচে সাবমিট করুন</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
                )}

                {/* Payment method with logos */}
                <div>
                  <Label className="mb-2 block">পেমেন্ট মাধ্যম নির্বাচন করুন</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "bkash", label: "বিকাশ", logo: "/bkash_logo_0.webp", color: "border-pink-400 bg-pink-50" },
                      { id: "nagad", label: "নগদ", logo: "/nagad.webp", color: "border-orange-400 bg-orange-50" },
                      { id: "rocket", label: "রকেট", logo: "/unnamed (1).png", color: "border-purple-400 bg-purple-50" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                          paymentMethod === m.id ? m.color + " shadow-md scale-[1.02]" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <img src={m.logo} alt={m.label} className="h-8 w-auto object-contain" />
                        <span className={`text-xs font-semibold ${paymentMethod === m.id ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show payment number based on selection */}
                <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">এই নম্বরে পেমেন্ট করুন:</p>
                  <p className="text-xl font-bold text-foreground">
                    {paymentMethod === "bkash" && (siteSettings.bkash_number || "নম্বর সেট করা হয়নি")}
                    {paymentMethod === "nagad" && (siteSettings.nagad_number || "নম্বর সেট করা হয়নি")}
                    {paymentMethod === "rocket" && (siteSettings.rocket_number || "নম্বর সেট করা হয়নি")}
                  </p>
                  <p className="mt-1 text-xs text-sky-600 font-medium">
                    {paymentMethod === "bkash" ? "বিকাশ" : paymentMethod === "nagad" ? "নগদ" : "রকেট"} পার্সোনাল নম্বর
                  </p>
                </div>

                {/* Phone & Transaction ID */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>আপনার ফোন নম্বর *</Label>
                    <Input
                      placeholder="০১XXXXXXXXX"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      required
                  />
                </div>
                <div>
                  <Label>ট্রানজেকশন আইডি *</Label>
                  <Input
                    placeholder="ট্রানজেকশন আইডি লিখুন"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                  />
                </div>
                </div>
                <Button type="submit" className="w-full rounded-full bg-sky-600 py-3 text-base font-semibold shadow-lg hover:bg-sky-700" disabled={loading}>
                  {loading ? "সাবমিট হচ্ছে..." : "অর্ডার সাবমিট করুন"}
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
