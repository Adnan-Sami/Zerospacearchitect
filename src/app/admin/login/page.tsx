"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otherSession, setOtherSession] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .then(({ data: roles }) => {
          const userRoles = (roles ?? []).map((r: any) => r.role);
          if (!userRoles.includes("admin")) {
            setOtherSession(session.user.email ?? "");
          }
        });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("ইমেইল ও পাসওয়ার্ড দিন");
      return;
    }
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("ইমেইল বা পাসওয়ার্ড ভুল।");
      setLoading(false);
      return;
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");

    if (!roles?.length) {
      await supabase.auth.signOut();
      setError("আপনার অ্যাডমিন অ্যাক্সেস নেই।");
      setLoading(false);
      return;
    }

    router.push("/admin");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Image src="/logo.png" alt="ZeroSpace Architect" width={160} height={50} className="h-12 w-auto" />
          </div>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
            <Shield className="h-6 w-6 text-sky-600" />
          </div>
          <CardTitle className="text-2xl">অ্যাডমিন লগ-ইন</CardTitle>
          <CardDescription>অ্যাডমিন প্যানেলে প্রবেশ করতে লগ-ইন করুন</CardDescription>
        </CardHeader>
        <CardContent>
          {otherSession && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm sm:p-4">
              <p className="font-semibold leading-snug text-amber-800">আপনি ইতিমধ্যে ভিন্ন অ্যাকাউন্টে লগ-ইন করেছেন</p>
              <p className="mt-1 break-all text-amber-700">{otherSession}</p>
              <p className="mt-2 leading-relaxed text-amber-600">নতুন অ্যাডমিন অ্যাকাউন্টে লগ-ইন করলে বর্তমান সেশন বন্ধ হয়ে যাবে।</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" variant="outline" size="sm" className="h-auto min-h-9 w-full whitespace-normal border-amber-300 py-2 text-center leading-snug text-amber-800 hover:bg-amber-100 sm:w-auto" onClick={async () => {
                  await supabase.auth.signOut();
                  setOtherSession(null);
                }}>
                  সেশন রিসেট করুন
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <div>
              <Label>ইমেইল</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <Label>পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড"
                  required
                  className="pr-12"
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
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "লগ-ইন করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
