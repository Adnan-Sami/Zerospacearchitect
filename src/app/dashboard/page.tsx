"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { DashboardNavbar, StudentLayout } from "@/components/DashboardNavbar";
import { DeviceGuard } from "@/components/DeviceGuard";
import { Footer } from "@/components/Footer";
import { OrderStatusCard } from "@/components/OrderStatusCard";
import { BookOrdersCard } from "@/components/BookOrdersCard";
import { supabase } from "@/integrations/supabase/client";
import { toBn } from "@/lib/utils";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    certificates: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const [profileRes, enrollRes, certRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("enrollments")
          .select("*, courses(id, title, thumbnail_url, instructor_name, modules(id, lessons(id)))")
          .eq("user_id", userId),
        supabase.from("certificates").select("id").eq("user_id", userId),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setAvatarUrl(profileRes.data.avatar_url || "");
      }

      const enrollData = enrollRes.data ?? [];
      const enriched = await Promise.all(
        enrollData.map(async (e: any) => {
          const lessonIds =
            e.courses?.modules?.flatMap(
              (m: any) => m.lessons?.map((l: any) => l.id) ?? []
            ) ?? [];
          if (lessonIds.length === 0)
            return { ...e, progress: 0, totalLessons: 0, completedLessons: 0 };
          const { data: pr } = await supabase
            .from("lesson_progress")
            .select("id")
            .eq("user_id", userId)
            .eq("completed", true)
            .in("lesson_id", lessonIds);
          const done = pr?.length ?? 0;
          return {
            ...e,
            progress: Math.round((done / lessonIds.length) * 100),
            totalLessons: lessonIds.length,
            completedLessons: done,
          };
        })
      );

      setEnrollments(enriched);
      setStats({
        total: enriched.length,
        completed: enriched.filter((e) => e.progress === 100).length,
        inProgress: enriched.filter((e) => e.progress > 0 && e.progress < 100).length,
        certificates: certRes.data?.length ?? 0,
      });
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          লোড হচ্ছে...
        </div>
      </StudentLayout>
    );
  }

  const statCards = [
    { label: "মোট কোর্স", value: stats.total, icon: BookOpen, color: "text-blue-600" },
    { label: "চলমান", value: stats.inProgress, icon: TrendingUp, color: "text-amber-600" },
    { label: "সম্পন্ন", value: stats.completed, icon: GraduationCap, color: "text-green-600" },
    { label: "সার্টিফিকেট", value: stats.certificates, icon: Award, color: "text-purple-600" },
  ];

  return (
    <DeviceGuard>
    <StudentLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback>
                <User className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                স্বাগতম, {fullName || "শিক্ষার্থী"}!
              </h1>
              <p className="text-sm text-muted-foreground">
                আপনার শেখার অগ্রগতি দেখুন
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <User className="mr-1 h-4 w-4" />প্রোফাইল
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="sm">
                <BookOpen className="mr-1 h-4 w-4" />নতুন কোর্স
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{toBn(s.value)}</p>
                </div>
                <s.icon className={`h-10 w-10 ${s.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">সামগ্রিক অগ্রগতি</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground tabular-nums">
                {toBn(stats.completed)} / {toBn(stats.total)} কোর্স সম্পন্ন
              </span>
              <span className="font-semibold tabular-nums">
                {toBn(stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0)}%
              </span>
            </div>
            <Progress
              value={
                stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
              }
              className="h-3"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              সকল কোর্স ১০০% সম্পন্ন করলে স্বয়ংক্রিয়ভাবে সার্টিফিকেট পাবেন।
            </p>
          </CardContent>
        </Card>

        <OrderStatusCard />

        <BookOrdersCard />

        <Card>
          <CardHeader>
            <CardTitle>আমার কোর্সসমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="py-10 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-4 text-sm text-muted-foreground">
                  আপনি এখনো কোনো কোর্সে এনরোল করেননি।
                </p>
                <Link href="/courses">
                  <Button size="sm">কোর্স ব্রাউজ করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row"
                  >
                    <div className="h-24 w-full flex-shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
                      {e.courses?.thumbnail_url ? (
                        <Image
                          src={e.courses.thumbnail_url}
                          alt=""
                          width={160}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold">{e.courses?.title}</h3>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {e.courses?.instructor_name}
                      </p>
                      <div className="mb-2 flex items-center gap-2">
                        <Progress value={e.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium tabular-nums">{toBn(e.progress)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {toBn(e.completedLessons)}/{toBn(e.totalLessons)} লেসন সম্পন্ন
                        </span>
                        <Link href={`/learn/${e.courses?.id}`}>
                          <Button size="sm" variant="outline">
                            {e.progress === 0 ? "শুরু করুন" : "চালিয়ে যান"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
    </DeviceGuard>
  );
}
