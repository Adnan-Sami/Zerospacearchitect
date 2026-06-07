"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, phoneToEmail } from "@/lib/phone-auth";

export default function InstructorRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("নাম লিখুন।"); return; }
    if (!isValidPhone(phone)) { setError("সঠিক ফোন নম্বর দিন।"); return; }
    if (password.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"); return; }
    setLoading(true);

    // Create user via server API
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, fullName: fullName.trim() }),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error || "রেজিস্ট্রেশন ব্যর্থ"); setLoading(false); return; }

    // Sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });
    if (signInError || !data.user) {
      setError("রেজিস্ট্রেশন সফল! লগ-ইন পেজ থেকে প্রবেশ করুন।");
      setLoading(false);
      return;
    }

    // Assign instructor role via API
    await fetch("/api/assign-instructor-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user.id }),
    });

    router.push("/instructor");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-xl">🎓</span>
            </div>
            <CardTitle className="text-2xl">ইন্সট্রাক্টর রেজিস্ট্রেশন</CardTitle>
            <CardDescription>ইন্সট্রাক্টর হিসেবে অ্যাকাউন্ট তৈরি করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <div>
                <Label>পুরো নাম *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার নাম" required />
              </div>
              <div>
                <Label>ফোন নম্বর *</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="০১XXXXXXXXX" required />
              </div>
              <div>
                <Label>পাসওয়ার্ড *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন করুন"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link href="/instructor/login" className="text-purple-600 hover:underline">লগ-ইন করুন</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
