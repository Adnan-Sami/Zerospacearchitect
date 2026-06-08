"use client";

import { useEffect, useState } from "react";
import { DollarSign, BookOpen, Users, Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

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
        .select("user_id, full_name, phone, created_at, payment_method, payment_number, bank_name, bank_account_name, bank_branch")
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
        let orderQuery = supabase
          .from("orders")
          .select("course_id, amount, created_at")
          .eq("status", "approved")
          .in("course_id", courseIds);

        if (selectedMonth !== "all") {
          const [year, month] = selectedMonth.split("-").map(Number);
          const startDate = new Date(year, month - 1, 1).toISOString();
          const endDate = new Date(year, month, 1).toISOString();
          orderQuery = orderQuery.gte("created_at", startDate).lt("created_at", endDate);
        }

        const { data: orders } = await orderQuery;

        (orders ?? []).forEach((o: any) => {
          if (!orderMap[o.course_id]) orderMap[o.course_id] = { count: 0, revenue: 0 };
          orderMap[o.course_id].count++;
          orderMap[o.course_id].revenue += Number(o.amount);
        });
      }

      // Build instructor data
      let total = 0;

      // Get all payments
      const { data: allPayments } = await supabase.from("instructor_payments").select("instructor_id, amount");
      const paidMap: Record<string, number> = {};
      (allPayments ?? []).forEach((p: any) => {
        paidMap[p.instructor_id] = (paidMap[p.instructor_id] || 0) + Number(p.amount);
      });

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
        const paid = paidMap[p.user_id] || 0;
        const balance = commission - paid;
        total += balance;

        return {
          ...p,
          totalCourses: courses.length,
          approvedCourses: approvedCourses.length,
          pendingCourses: courses.filter((c: any) => c.status === "pending").length,
          totalSales,
          totalRevenue,
          commission,
          paid,
          balance,
          courseDetails,
        };
      });

      setTotalCommission(total);
      setInstructors(result.sort((a, b) => b.balance - a.balance));
    };
    load();
  }, [selectedMonth]);

  const exportCSV = () => {
    const monthLabel = selectedMonth === "all" ? "সর্বমোট" : selectedMonth;
    const headers = ["নাম", "ফোন", "পেমেন্ট মেথড", "নম্বর", "মোট সেল", "কমিশন", "পেইড", "বকেয়া"];
    const rows = instructors.map((i) => [
      i.full_name, i.phone,
      i.payment_method || "—", i.payment_number || "—",
      i.totalSales, i.commission, i.paid, i.balance,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `instructors-${monthLabel}.csv`;
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

      {/* Month filter */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <label className="text-sm font-medium">মাস ফিল্টার:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">সর্বমোট</option>
          {Array.from({ length: 12 }, (_, i) => {
            const now = new Date();
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("bn-BD", { year: "numeric", month: "long" });
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
        {selectedMonth !== "all" && (
          <Badge className="bg-sky-100 text-sky-700">{selectedMonth}</Badge>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">মোট ইন্সট্রাক্টর</p>
            <p className="mt-1 text-2xl font-bold">{instructors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">মোট কমিশন</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">৳{instructors.reduce((s, i) => s + i.commission, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">মোট পেইড</p>
            <p className="mt-1 text-2xl font-bold text-green-600">৳{instructors.reduce((s, i) => s + i.paid, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-5">
            <p className="text-xs text-amber-700">বকেয়া (দিতে হবে)</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">৳{totalCommission.toLocaleString()}</p>
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
                  {inst.payment_method ? (
                    <div className="mt-1 text-xs text-green-600">
                      {inst.payment_method === "bank" ? (
                        <span>🏦 {inst.bank_name} · {inst.bank_account_name} · {inst.payment_number} · {inst.bank_branch}</span>
                      ) : (
                        <span>💳 {inst.payment_method === "bkash" ? "বিকাশ" : inst.payment_method === "nagad" ? "নগদ" : "রকেট"}: {inst.payment_number}</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-red-500">⚠️ পেমেন্ট মেথড সেট করেনি</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-sky-600" onClick={async () => {
                        await fetch("/api/notify-admins", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId: inst.user_id,
                            userTitle: "পেমেন্ট মেথড যোগ করুন",
                            userMessage: "আপনার পেমেন্ট পাঠাতে পেমেন্ট মেথড (বিকাশ/নগদ/ব্যাংক) যোগ করুন। আয় → পেমেন্ট মেথড সেকশনে যান।",
                            userLink: "/instructor/earnings",
                            title: "", message: "", type: "payment",
                          }),
                        });
                        toast.success("রিকোয়েস্ট পাঠানো হয়েছে");
                      }}>
                        📩 রিকোয়েস্ট পাঠান
                      </Button>
                    </div>
                  )}
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
                  <p className="text-xs text-green-600">পেইড: ৳{inst.paid.toLocaleString()}</p>
                  {inst.balance > 0 && <p className="text-xs font-semibold text-amber-600">বকেয়া: ৳{inst.balance.toLocaleString()}</p>}
                  {inst.balance > 0 && (
                    <Button size="sm" className="mt-2 h-7 bg-green-600 text-xs hover:bg-green-700" onClick={() => { setPayingId(inst.user_id); setPayAmount(String(inst.balance)); setPayNote(""); }}>
                      <CreditCard className="mr-1 h-3 w-3" />পেমেন্ট করুন
                    </Button>
                  )}
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

      {/* Payment Modal */}
      {payingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="mb-4 font-bold">পেমেন্ট রেকর্ড করুন</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">পরিমাণ (৳)</label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">নোট (ঐচ্ছিক)</label>
                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="যেমন: বিকাশে পাঠানো হয়েছে" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={async () => {
                  if (!payAmount || Number(payAmount) <= 0) return;
                  const now = new Date();
                  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                  await supabase.from("instructor_payments").insert({
                    instructor_id: payingId,
                    amount: Number(payAmount),
                    month,
                    note: payNote || null,
                  });
                  // Notify instructor
                  await fetch("/api/notify-admins", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: payingId,
                      userTitle: "পেমেন্ট প্রাপ্ত! 💰",
                      userMessage: `৳${Number(payAmount).toLocaleString()} পেমেন্ট করা হয়েছে।`,
                      userLink: "/instructor/earnings",
                      title: "", message: "", type: "payment",
                    }),
                  });
                  setPayingId(null);
                  toast.success("পেমেন্ট রেকর্ড হয়েছে ও ইন্সট্রাক্টর নোটিফাই হয়েছে");
                }}>
                  পেমেন্ট কনফার্ম
                </Button>
                <Button variant="outline" onClick={() => setPayingId(null)}>বাতিল</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
