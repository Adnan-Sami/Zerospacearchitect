"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, phoneToEmail } from "@/lib/phone-auth";

export default function InstructorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "instructor");
    if (!roles?.length) {
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
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Image src="/logo.png" alt="ZeroSpace Architect" width={180} height={56} className="mx-auto h-12 w-auto" />
          </div>

          <h1 className="mb-2 text-2xl font-black text-gray-900">ইন্সট্রাক্টর লগ-ইন</h1>
          <p className="mb-8 text-sm text-gray-500">আপনার ইন্সট্রাক্টর অ্যাকাউন্টে প্রবেশ করুন</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-700">ফোন নম্বর</Label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
                required
                className="mt-1.5 h-12 rounded-lg border-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">পাসওয়ার্ড</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড"
                  required
                  className="h-12 rounded-lg border-gray-300 pr-12"
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
            <Button type="submit" className="h-12 w-full rounded-lg bg-purple-600 text-base font-bold hover:bg-purple-700" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/instructor/register" className="font-semibold text-purple-600 hover:underline">রেজিস্ট্রেশন করুন</Link>
          </p>
        </div>
      </div>

      {/* Right - Image */}
      <div className="hidden w-1/2 lg:block">
        <Image
          src="/Instructor1.png"
          alt="Instructor"
          width={1000}
          height={1200}
          className="h-screen w-full object-cover sticky top-0"
        />
      </div>
    </div>
  );
}
