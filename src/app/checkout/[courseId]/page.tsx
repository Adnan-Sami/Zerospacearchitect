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
          <Card>
            <CardHeader>
              <CardTitle>পেমেন্ট করুন</CardTitle>
              <CardDescription>
                {course.title} — ৳
                {Number(course.price).toLocaleString("bn-BD")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg bg-primary/5 p-4">
                <h3 className="mb-2 font-semibold text-primary">
                  পেমেন্ট নির্দেশনা:
                </h3>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>
                    নিচের যেকোনো নম্বরে{" "}
                    <strong>
                      ৳{Number(course.price).toLocaleString("bn-BD")}
                    </strong>{" "}
                    পাঠান
                  </li>
                  {siteSettings.bkash_number && (
                    <li>
                      বিকাশ: <strong>{siteSettings.bkash_number}</strong>
                    </li>
                  )}
                  {siteSettings.nagad_number && (
                    <li>
                      নগদ: <strong>{siteSettings.nagad_number}</strong>
                    </li>
                  )}
                  {siteSettings.rocket_number && (
                    <li>
                      রকেট: <strong>{siteSettings.rocket_number}</strong>
                    </li>
                  )}
                  <li>ট্রানজেকশন আইডি ও ফোন নম্বর নিচে সাবমিট করুন</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label>পেমেন্ট মাধ্যম</Label>
                  <div className="flex gap-2">
                    {["bkash", "nagad", "rocket"].map((m) => (
                      <Badge
                        key={m}
                        variant={paymentMethod === m ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m === "bkash"
                          ? "বিকাশ"
                          : m === "nagad"
                          ? "নগদ"
                          : "রকেট"}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>আপনার ফোন নম্বর</Label>
                  <Input
                    placeholder="০১XXXXXXXXX"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ট্রানজেকশন আইডি</Label>
                  <Input
                    placeholder="ট্রানজেকশন আইডি লিখুন"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
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
