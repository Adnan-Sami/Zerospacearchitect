"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BdPhoneInput, isValidBdLocalPhone } from "@/components/BdPhoneInput";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/phone-auth";

export default function InstructorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otherSession, setOtherSession] = useState<{
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .then(({ data: roles }) => {
          const userRoles = (roles ?? []).map((r: any) => r.role);
          if (!userRoles.includes("instructor")) {
            const currentRole = userRoles.includes("admin")
              ? "অ্যাডমিন"
              : userRoles.includes("student")
                ? "শিক্ষার্থী"
                : "ব্যবহারকারী";
            setOtherSession({
              email: session.user.email ?? "",
              role: currentRole,
            });
          }
        });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidBdLocalPhone(phone)) {
      setError("+88 এর পরে ১১ ডিজিটের সঠিক বাংলাদেশি ফোন নম্বর দিন।");
      return;
    }
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: phoneToEmail(phone),
        password,
      },
    );
    if (signInError) {
      setError("ফোন নম্বর বা পাসওয়ার্ড ভুল।");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "instructor");
    if (!roles?.length) {
      await supabase.auth.signOut();
      setError("আপনার ইন্সট্রাক্টর অ্যাক্সেস নেই।");
      setLoading(false);
      return;
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
            <Image
              src="/logo.png"
              alt="ZeroSpace Architect"
              width={180}
              height={56}
              className="mx-auto h-12 w-auto"
            />
          </div>

          <h1 className="mb-2 text-2xl font-black text-gray-900">
            ইন্সট্রাক্টর লগ-ইন
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            আপনার ইন্সট্রাক্টর অ্যাকাউন্টে প্রবেশ করুন
          </p>

          {otherSession && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm sm:p-4">
              <p className="font-semibold leading-snug text-amber-800">
                আপনি ইতিমধ্যে {otherSession.role} হিসাবে লগ-ইন করেছেন
              </p>
              <p className="mt-1 break-all text-amber-700">
                {otherSession.email}
              </p>
              <p className="mt-2 leading-relaxed text-amber-600">
                নতুন ইন্সট্রাক্টর অ্যাকাউন্টে লগ-ইন করলে বর্তমান সেশন বন্ধ হয়ে
                যাবে।
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {otherSession.role === "অ্যাডমিন" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-9 w-full whitespace-normal border-amber-300 py-2 text-center leading-snug text-amber-800 hover:bg-amber-100 sm:w-auto"
                    onClick={() => router.push("/admin")}
                  >
                    অ্যাডমিন প্যানেলে যান
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-9 w-full whitespace-normal border-amber-300 py-2 text-center leading-snug text-amber-800 hover:bg-amber-100 sm:w-auto"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setOtherSession(null);
                  }}
                >
                  সেশন রিসেট করুন
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                ফোন নম্বর
              </Label>
              <BdPhoneInput value={phone} onChange={setPhone} />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                পাসওয়ার্ড
              </Label>
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
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-lg bg-purple-600 text-base font-bold hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              href="/instructor/register"
              className="font-semibold text-purple-600 hover:underline"
            >
              রেজিস্ট্রেশন করুন
            </Link>
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
