"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, DollarSign, Eye, Clock, UserCircle, ArrowRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function InstructorDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, earnings: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;

      // Check if instructor has submitted profile
      const { data: profileData } = await supabase
        .from("instructor_profile_details")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Show popup only if no profile submitted yet
      if (!profileData) {
        setShowProfilePopup(true);
      }

      const { data } = await supabase
        .from("instructor_courses")
        .select("course_id, course_title, status")
        .eq("instructor_id", session.user.id)
        .order("created_at", { ascending: false });

      const list = data ?? [];
      setCourses(list);
      const published = list.filter((c: any) => c.status === "approved").length;
      const pending = list.filter((c: any) => c.status === "pending").length;

      // Get earnings from server API (bypasses RLS)
      const res = await fetch("/api/instructor-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId: session.user.id }),
      });
      const earningsData = await res.json();

      setStats({ total: list.length, published, pending, earnings: earningsData.total ?? 0 });
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ইন্সট্রাক্টর ড্যাশবোর্ড</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">মোট কোর্স</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">পাবলিশড</p><p className="mt-1 text-2xl font-bold">{stats.published}</p></div>
            <Eye className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">পেন্ডিং</p><p className="mt-1 text-2xl font-bold">{stats.pending}</p></div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">আনুমানিক আয়</p><p className="mt-1 text-2xl font-bold">৳{stats.earnings.toLocaleString()}</p></div>
            <DollarSign className="h-8 w-8 text-sky-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">আমার কোর্সসমূহ</CardTitle></CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো কোর্স আপলোড করা হয়নি।</p>
          ) : (
            <div className="space-y-3">
              {courses.map((c: any) => (
                <div key={c.course_id || c.course_title} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{c.course_title}</p>
                  </div>
                  <Badge className={c.status === "approved" ? "bg-green-100 text-green-800" : c.status === "rejected" ? "bg-red-100 text-red-800" : c.status === "draft" ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"}>
                    {c.status === "approved" ? "✅ অ্যাপ্রুভড" : c.status === "rejected" ? "❌ রিজেক্ট" : c.status === "draft" ? "📝 ড্রাফট" : "⏳ পেন্ডিং"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Submit Popup */}
      {showProfilePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => setShowProfilePopup(false)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <UserCircle className="h-9 w-9 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold">আপনার প্রোফাইল সাবমিট করুন!</h3>
              <p className="text-sm text-white/80">
                মূল সাইটে ইন্সট্রাক্টর হিসেবে প্রদর্শিত হতে আপনার প্রোফাইল তথ্য জমা দিন।
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="mb-4 text-sm text-gray-600">
                আপনার নাম, ছবি, বায়ো, সোশ্যাল লিংক সহ পূর্ণ প্রোফাইল দিন। অ্যাডমিন রিভিউ করে আপনাকে পাবলিক &quot;আমাদের প্রশিক্ষক&quot; পেজে যোগ করবেন।
              </p>
              <Link href="/instructor/profile">
                <Button className="w-full rounded-full bg-purple-600 font-semibold hover:bg-purple-700">
                  প্রোফাইল সাবমিট করুন <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <button
                className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
                onClick={() => setShowProfilePopup(false)}
              >
                পরে করব
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
