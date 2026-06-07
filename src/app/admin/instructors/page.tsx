"use client";

import { useEffect, useState } from "react";
import { DollarSign, BookOpen, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Get all users with instructor role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "instructor");

      if (!roles?.length) { setInstructors([]); return; }

      const userIds = roles.map((r) => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, created_at")
        .in("user_id", userIds);

      // Get instructor courses with linked course data
      const { data: instructorCourses } = await supabase
        .from("instructor_courses")
        .select("instructor_id, course_id, course_title, status")
        .in("instructor_id", userIds);

      // Get all approved orders for courses linked to instructors
      const courseIds = (instructorCourses ?? [])
        .filter((ic: any) => ic.course_id && ic.status === "approved")
        .map((ic: any) => ic.course_id);

      let orderMap: Record<string, { count: number; revenue: number }> = {};
      if (courseIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("course_id, amount")
          .eq("status", "approved")
          .in("course_id", courseIds);

        (orders ?? []).forEach((o: any) => {
          if (!orderMap[o.course_id]) orderMap[o.course_id] = { count: 0, revenue: 0 };
          orderMap[o.course_id].count++;
          orderMap[o.course_id].revenue += Number(o.amount);
        });
      }

      // Build instructor data
      let total = 0;
      const result = (profiles ?? []).map((p: any) => {
        const courses = (instructorCourses ?? []).filter((ic: any) => ic.instructor_id === p.user_id);
        const approvedCourses = courses.filter((c: any) => c.status === "approved");
        
        let totalRevenue = 0;
        let totalSales = 0;
        const courseDetails = approvedCourses.map((c: any) => {
          const stats = orderMap[c.course_id] || { count: 0, revenue: 0 };
          totalRevenue += stats.revenue;
          totalSales += stats.count;
          return { title: c.course_title, sales: stats.count, revenue: stats.revenue, commission: Math.round(stats.revenue * 0.4) };
        });

        const commission = Math.round(totalRevenue * 0.4);
        total += commission;

        return {
          ...p,
          totalCourses: courses.length,
          approvedCourses: approvedCourses.length,
          pendingCourses: courses.filter((c: any) => c.status === "pending").length,
          totalSales,
          totalRevenue,
          commission,
          courseDetails,
        };
      });

      setTotalCommission(total);
      setInstructors(result.sort((a, b) => b.commission - a.commission));
    };
    load();
  }, []);

  const exportCSV = () => {
    const headers = ["নাম", "ফোন", "মোট কোর্স", "লাইভ কোর্স", "মোট সেল", "মোট রেভিনিউ", "কমিশন (40%)"];
    const rows = instructors.map((i) => [
      i.full_name, i.phone, i.totalCourses, i.approvedCourses, i.totalSales,
      i.totalRevenue, i.commission,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "instructors-earnings.csv";
    link.click();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ইন্সট্রাক্টর তালিকা ({instructors.length})</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="mr-1 h-3 w-3" />CSV ডাউনলোড
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">মোট ইন্সট্রাক্টর</p><p className="mt-1 text-2xl font-bold">{instructors.length}</p></div>
            <Users className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">মোট কমিশন দিতে হবে</p><p className="mt-1 text-2xl font-bold text-purple-600">৳{totalCommission.toLocaleString()}</p></div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div><p className="text-sm text-muted-foreground">লাইভ কোর্স (ইন্সট্রাক্টর)</p><p className="mt-1 text-2xl font-bold">{instructors.reduce((s, i) => s + i.approvedCourses, 0)}</p></div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
      </div>

      {/* Instructor list */}
      <div className="space-y-4">
        {instructors.map((inst) => (
          <Card key={inst.user_id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold">{inst.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{inst.phone} · যোগদান: {new Date(inst.created_at).toLocaleDateString("bn-BD")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-purple-100 text-purple-800">{inst.totalCourses} কোর্স</Badge>
                    <Badge className="bg-green-100 text-green-800">{inst.approvedCourses} লাইভ</Badge>
                    {inst.pendingCourses > 0 && <Badge className="bg-yellow-100 text-yellow-800">{inst.pendingCourses} পেন্ডিং</Badge>}
                    <Badge className="bg-sky-100 text-sky-800">{inst.totalSales} সেল</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">কমিশন (৪০%)</p>
                  <p className="text-2xl font-black text-purple-600">৳{inst.commission.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">রেভিনিউ: ৳{inst.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Course breakdown */}
              {inst.courseDetails.length > 0 && (
                <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">কোর্সওয়ারি আয়:</p>
                  <div className="space-y-1.5">
                    {inst.courseDetails.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{c.title}</span>
                        <span className="text-muted-foreground">{c.sales} সেল · ৳{c.revenue} → <span className="font-semibold text-purple-600">৳{c.commission}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {instructors.length === 0 && <p className="py-10 text-center text-muted-foreground">কোনো ইন্সট্রাক্টর নেই।</p>}
      </div>
    </div>
  );
}
