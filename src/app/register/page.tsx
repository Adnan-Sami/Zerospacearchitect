"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, phoneToEmail } from "@/lib/phone-auth";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("নাম লিখুন।");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("সঠিক ফোন নম্বর দিন।");
      return;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    setLoading(true);

    // Step 1: Create user via server API (no email sent)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, fullName: fullName.trim() }),
    });
    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
      setLoading(false);
      return;
    }

    // Step 2: Sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });

    if (signInError) {
      setError("রেজিস্ট্রেশন সফল! লগ-ইন পেজ থেকে প্রবেশ করুন।");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">রেজিস্ট্রেশন</CardTitle>
            <CardDescription>
              ফোন নম্বর ও পাসওয়ার্ড দিয়ে নতুন অ্যাকাউন্ট তৈরি করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">পুরো নাম</Label>
                <Input
                  id="fullName"
                  placeholder="আপনার নাম"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন নম্বর</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="০১XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন করুন"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                অ্যাকাউন্ট আছে?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  লগ-ইন করুন
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
