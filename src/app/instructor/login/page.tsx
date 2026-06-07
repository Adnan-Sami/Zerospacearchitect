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

export default function InstructorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isEmail && !isValidPhone(trimmed)) { setError("সঠিক ফোন নম্বর দিন।"); return; }
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: isEmail ? trimmed : phoneToEmail(trimmed),
      password,
    });
    if (signInError) { setError("ফোন নম্বর বা পাসওয়ার্ড ভুল।"); setLoading(false); return; }

    // Check instructor role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "instructor");
    if (!roles?.length) {
      // Also allow admin
      const { data: adminRoles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin");
      if (!adminRoles?.length) {
        await supabase.auth.signOut();
        setError("আপনার ইন্সট্রাক্টর অ্যাক্সেস নেই।");
        setLoading(false);
        return;
      }
    }

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
            <CardTitle className="text-2xl">ইন্সট্রাক্টর লগ-ইন</CardTitle>
            <CardDescription>আপনার ইন্সট্রাক্টর অ্যাকাউন্টে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <div>
                <Label>ফোন নম্বর</Label>
                <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="০১XXXXXXXXX" required />
              </div>
              <div>
                <Label>পাসওয়ার্ড</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড" required />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                অ্যাকাউন্ট নেই?{" "}
                <Link href="/instructor/register" className="text-purple-600 hover:underline">রেজিস্ট্রেশন করুন</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
