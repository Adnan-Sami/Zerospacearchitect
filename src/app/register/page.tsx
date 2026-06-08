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

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("নাম লিখুন।"); return; }
    if (!isValidPhone(phone)) { setError("সঠিক ফোন নম্বর দিন।"); return; }
    if (password.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"); return; }
    setLoading(true);

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
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <div className="grid md:grid-cols-2">
            {/* Left - Form */}
            <div className="p-8 md:p-10">
              <h1 className="mb-2 text-3xl font-black text-gray-900">নতুন অ্যাকাউন্ট</h1>
              <p className="mb-8 text-sm text-gray-500">ফোন নম্বর দিয়ে রেজিস্ট্রেশন করুন</p>

              <form onSubmit={handleRegister} className="space-y-5">
                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">পুরো নাম</Label>
                  <Input
                    placeholder="আপনার নাম"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1.5 h-12 rounded-lg border-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">ফোন নম্বর</Label>
                  <Input
                    type="tel"
                    placeholder="০১XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-1.5 h-12 rounded-lg border-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">পাসওয়ার্ড</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                  {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন করুন"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                অ্যাকাউন্ট আছে?{" "}
                <Link href="/login" className="font-semibold text-sky-600 hover:underline">লগ-ইন করুন</Link>
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
