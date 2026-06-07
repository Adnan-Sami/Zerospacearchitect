"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceFingerprint, getDeviceInfo } from "@/lib/device-fingerprint";

export function DeviceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "banned" | "different_device" | "ip_banned">("loading");
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("allowed"); return; }

      const fingerprint = getDeviceFingerprint();
      const deviceInfo = getDeviceInfo();

      const res = await fetch("/api/verify-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          fingerprint,
          deviceInfo,
        }),
      });

      if (!res.ok) {
        // API error — allow access but don't show warning
        setStatus("allowed");
        return;
      }

      const result = await res.json();

      if (result.allowed) {
        setStatus("allowed");
        setShowWarning(true);
      } else if (result.reason === "banned") {
        setStatus("banned");
      } else if (result.reason === "ip_banned") {
        setStatus("ip_banned");
        await supabase.auth.signOut();
      } else if (result.reason === "different_device") {
        setStatus("different_device");
        await supabase.auth.signOut();
      } else {
        setStatus("allowed");
      }
    };
    verify();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        যাচাই হচ্ছে...
      </div>
    );
  }

  if (status === "banned") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-red-800">অ্যাকাউন্ট ব্যান করা হয়েছে</h1>
          <p className="mb-4 text-sm text-red-700">
            আপনার অ্যাকাউন্ট নিরাপত্তা কারণে ব্যান করা হয়েছে। একাধিক ডিভাইস থেকে লগইন করা আমাদের নীতিমালা বিরুদ্ধ।
          </p>
          <p className="text-xs text-red-600">
            সমস্যা সমাধানের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            হোমে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  if (status === "ip_banned") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-red-800">IP ব্লক করা হয়েছে</h1>
          <p className="mb-4 text-sm text-red-700">
            আপনার IP অ্যাড্রেস নিরাপত্তা কারণে ব্লক করা হয়েছে।
          </p>
          <p className="text-xs text-red-600">
            অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            হোমে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  if (status === "different_device") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-red-800">ভিন্ন ডিভাইস সনাক্ত হয়েছে!</h1>
          <p className="mb-4 text-sm text-red-700">
            আপনি অন্য ডিভাইস থেকে লগইন করার চেষ্টা করেছেন। নিরাপত্তার জন্য আপনার অ্যাকাউন্ট সাময়িকভাবে ব্যান করা হয়েছে।
          </p>
          <p className="text-xs text-red-600">
            অ্যাডমিনের সাথে যোগাযোগ করে আনব্যান করুন।
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            হোমে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Security warning popup */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="font-bold text-foreground">নিরাপত্তা সতর্কতা</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
              আপনার অ্যাকাউন্ট শুধুমাত্র <strong>একটি ডিভাইস</strong> থেকে ব্যবহার করা যাবে। 
              অন্য কোনো ডিভাইস থেকে লগইন করলে আপনার অ্যাকাউন্ট <strong>স্বয়ংক্রিয়ভাবে ব্যান</strong> হয়ে যাবে।
            </p>
            <ul className="mb-4 space-y-1 text-xs text-muted-foreground">
              <li>⚠️ একাধিক ডিভাইসে লগইন করবেন না</li>
              <li>⚠️ আপনার পাসওয়ার্ড কাউকে দেবেন না</li>
              <li>⚠️ নিয়ম ভঙ্গে অ্যাকাউন্ট স্থায়ীভাবে ব্যান হতে পারে</li>
            </ul>
            <Button className="w-full bg-sky-600 hover:bg-sky-700" onClick={() => setShowWarning(false)}>
              বুঝেছি, চালিয়ে যান
            </Button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
