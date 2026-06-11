"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showPassword, setShowPassword] = useState(false);

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
      setError("আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।");
      setLoading(false);
      return;
    }

    // Block admin and instructor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const userRoles = (roles ?? []).map((r: any) => r.role);
    if (userRoles.includes("admin")) {
      await supabase.auth.signOut();
      setError("অ্যাডমিন অ্যাকাউন্ট এখানে লগ-ইন করতে পারবে না। অ্যাডমিন লগ-ইন পেজ ব্যবহার করুন।");
      setLoading(false);
      return;
    }
    if (userRoles.includes("instructor")) {
      await supabase.auth.signOut();
      setError("ইন্সট্রাক্টর অ্যাকাউন্ট এখানে লগ-ইন করতে পারবে না। ইন্সট্রাক্টর লগ-ইন পেজ ব্যবহার করুন।");
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
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <div className="grid md:grid-cols-2">
            {/* Left - Form */}
            <div className="p-8 md:p-10">
              <h1 className="mb-2 text-3xl font-black text-gray-900">স্বাগতম!</h1>
              <p className="mb-8 text-sm text-gray-500">আপনার অ্যাকাউন্টে লগ-ইন করুন</p>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">ফোন নম্বর</Label>
                  <Input
                    type="text"
                    placeholder="০১XXXXXXXXX"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    className="mt-1.5 h-12 rounded-lg border-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">পাসওয়ার্ড</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-lg border-gray-300 bg-gray-50 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-lg bg-sky-600 text-base font-bold hover:bg-sky-700" disabled={loading}>
                  {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                অ্যাকাউন্ট নেই?{" "}
                <Link href="/register" className="font-semibold text-sky-600 hover:underline">রেজিস্ট্রেশন করুন</Link>
              </p>
            </div>

            {/* Right - Image */}
            <div className="hidden md:block">
              <Image
                src="/Login.png"
                alt="Student"
                width={600}
                height={700}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
