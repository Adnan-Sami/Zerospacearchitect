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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/phone-auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [switchDialog, setSwitchDialog] = useState<{
    email: string;
    role: string;
  } | null>(null);

  // Check current session on mount — if logged in as different role, warn before allowing re-login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .then(({ data: roles }) => {
          const userRoles = (roles ?? []).map((r: any) => r.role);
          if (userRoles.includes("admin")) {
            setSwitchDialog({
              email: session.user.email ?? "",
              role: "অ্যাডমিন",
            });
          } else if (userRoles.includes("instructor")) {
            setSwitchDialog({
              email: session.user.email ?? "",
              role: "ইন্সট্রাক্টর",
            });
          }
        });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidBdLocalPhone(loginId)) {
      setError("+88 এর পরে ১১ ডিজিটের সঠিক বাংলাদেশি ফোন নম্বর দিন।");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(loginId),
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
        "আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।",
      );
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
      setError(
        "অ্যাডমিন অ্যাকাউন্ট এখানে লগ-ইন করতে পারবে না। অ্যাডমিন লগ-ইন পেজ ব্যবহার করুন।",
      );
      setLoading(false);
      return;
    }
    if (userRoles.includes("instructor")) {
      await supabase.auth.signOut();
      setError(
        "ইন্সট্রাক্টর অ্যাকাউন্ট এখানে লগ-ইন করতে পারবে না। ইন্সট্রাক্টর লগ-ইন পেজ ব্যবহার করুন।",
      );
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
            <div className="p-4 sm:p-8 md:p-10">
              <h1 className="mb-2 text-3xl font-black text-gray-900">
                স্বাগতম!
              </h1>
              <p className="mb-8 text-sm text-gray-500">
                আপনার অ্যাকাউন্টে লগ-ইন করুন
              </p>

              {switchDialog && (
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs">
                  <p className="font-medium leading-snug text-amber-800">
                    আপনি ইতিমধ্যে {switchDialog.role} হিসাবে লগ-ইন করেছেন
                    <span className="mt-0.5 block break-all font-normal text-amber-700 sm:mt-0 sm:inline sm:before:content-['—_']">
                      {switchDialog.email}
                    </span>
                  </p>
                  <p className="mt-1 leading-snug text-amber-600">
                    একই ব্রাউজারে ভিন্ন {switchDialog.role} অ্যাকাউন্টে লগ-ইন
                    করলে বর্তমান সেশন বন্ধ হয়ে যাবে।
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 whitespace-normal border-amber-300 px-2.5 py-1 text-xs leading-snug text-amber-800 hover:bg-amber-100"
                      onClick={() => {
                        const target =
                          switchDialog.role === "অ্যাডমিন"
                            ? "/admin/login"
                            : "/instructor/login";
                        router.push(target);
                      }}
                    >
                      {switchDialog.role} প্যানেলে যান
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 whitespace-normal border-amber-300 px-2.5 py-1 text-xs leading-snug text-amber-800 hover:bg-amber-100"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setSwitchDialog(null);
                      }}
                    >
                      সেশন রিসেট করে নতুন লগ-ইন করুন
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
                  <BdPhoneInput value={loginId} onChange={setLoginId} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    পাসওয়ার্ড
                  </Label>
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
                  className="h-12 w-full rounded-lg bg-sky-600 text-base font-bold hover:bg-sky-700"
                  disabled={loading}
                >
                  {loading ? "অপেক্ষা করুন..." : "লগ-ইন"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                অ্যাকাউন্ট নেই?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  রেজিস্ট্রেশন করুন
                </Link>
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
