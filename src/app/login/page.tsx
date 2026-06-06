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

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedLoginId = loginId.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedLoginId);
    const isPhone = isValidPhone(trimmedLoginId);

    if (!isPhone && !isEmail) {
      setError("সঠিক ফোন নম্বর বা ইমেইল দিন।");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: isEmail ? trimmedLoginId : phoneToEmail(trimmedLoginId),
      password,
    });
    if (error) {
      setError("ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে।");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (profile?.is_banned) {
      await supabase.auth.signOut();
      setError(
        "আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।"
      );
      setLoading(false);
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    router.push(roleData ? "/admin" : "/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">লগ-ইন করুন</CardTitle>
            <CardDescription>ফোন নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="loginId">ফোন নম্বর বা ইমেইল</Label>
                <Input
                  id="loginId"
                  type="text"
                  placeholder="০১XXXXXXXXX অথবা admin@example.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                অ্যাকাউন্ট নেই?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  রেজিস্ট্রেশন করুন
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
