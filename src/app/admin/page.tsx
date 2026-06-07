"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, ShoppingCart, DollarSign, Download, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Period = "all" | "month" | "year";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [courseStats, setCourseStats] = useState({ orders: 0, approved: 0, revenue: 0 });
  const [bookStats, setBookStats] = useState({ orders: 0, approved: 0, revenue: 0 });
  const [generalStats, setGeneralStats] = useState({ students: 0, courses: 0, books: 0 });
  const [courseOrders, setCourseOrders] = useState<any[]>([]);
  const [bookOrders, setBookOrders] = useState<any[]>([]);

  const getDateFilter = () => {
    const now = new Date();
    if (period === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    if (period === "year") {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    return null;
  };

  useEffect(() => {
    const fetchAll = async () => {
      const dateFrom = getDateFilter();

      // General stats
      const [{ count: students }, { count: courses }, { count: books }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
      ]);
      setGeneralStats({ students: students ?? 0, courses: courses ?? 0, books: books ?? 0 });

      // Course orders
      let courseQuery = supabase.from("orders").select("*, courses(title)").order("created_at", { ascending: false });
      if (dateFrom) courseQuery = courseQuery.gte("created_at", dateFrom);
      const { data: cOrders } = await courseQuery;
      const cData = cOrders ?? [];
      setCourseOrders(cData);
      const cApproved = cData.filter((o) => o.status === "approved");
      setCourseStats({
        orders: cData.length,
        approved: cApproved.length,
        revenue: cApproved.reduce((s, o) => s + Number(o.amount), 0),
      });

      // Book orders
      let bookQuery = supabase.from("book_orders").select("*, books(title)").order("created_at", { ascending: false });
      if (dateFrom) bookQuery = bookQuery.gte("created_at", dateFrom);
      const { data: bOrders } = await bookQuery;
      const bData = bOrders ?? [];
      setBookOrders(bData);
      const bApproved = bData.filter((o) => o.status === "approved");
      setBookStats({
        orders: bData.length,
        approved: bApproved.length,
        revenue: bApproved.reduce((s, o) => s + Number(o.amount), 0),
      });
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const totalRevenue = courseStats.revenue + bookStats.revenue;
  const totalOrders = courseStats.orders + bookStats.orders;

  // Export functions
  const exportCSV = (type: "course" | "book") => {
    const data = type === "course" ? courseOrders : bookOrders;
    const headers = ["তারিখ", "আইটেম", "পরিমাণ (৳)", "স্ট্যাটাস"];
    const rows = data.map((o) => [
      new Date(o.created_at).toLocaleDateString("bn-BD"),
      type === "course" ? o.courses?.title : o.books?.title,
      o.amount,
      o.status === "approved" ? "অ্যাপ্রুভড" : o.status === "rejected" ? "রিজেক্টেড" : "পেন্ডিং",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-orders-${period}.csv`;
    link.click();
  };

  const periodLabel = period === "month" ? "এই মাস" : period === "year" ? "এই বছর" : "সর্বমোট";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
        <div className="flex gap-2">
          {([
            { v: "all" as Period, l: "সর্বমোট" },
            { v: "month" as Period, l: "এই মাস" },
            { v: "year" as Period, l: "এই বছর" },
          ]).map((p) => (
            <Button
              key={p.v}
              size="sm"
              variant={period === p.v ? "default" : "outline"}
              onClick={() => setPeriod(p.v)}
            >
              {p.l}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">মোট আয় ({periodLabel})</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">৳{totalRevenue.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">মোট অর্ডার ({periodLabel})</CardTitle>
            <ShoppingCart className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">মোট শিক্ষার্থী</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{generalStats.students}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">কোর্স / বই</CardTitle>
            <BookOpen className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{generalStats.courses} / {generalStats.books}</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Analytics */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              কোর্স অর্ডার বিশ্লেষণ ({periodLabel})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => exportCSV("course")}>
              <Download className="mr-1 h-3 w-3" />CSV ডাউনলোড
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-sky-50 p-3 text-center">
              <p className="text-2xl font-bold text-sky-600">{courseStats.orders}</p>
              <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
            </div>
            <div className="rounded-lg border bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{courseStats.approved}</p>
              <p className="text-xs text-muted-foreground">অ্যাপ্রুভড</p>
            </div>
            <div className="rounded-lg border bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">৳{courseStats.revenue.toLocaleString("bn-BD")}</p>
              <p className="text-xs text-muted-foreground">আয়</p>
            </div>
          </div>
          {/* Recent orders */}
          {courseOrders.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">তারিখ</th>
                    <th className="px-3 py-2 text-left font-medium">কোর্স</th>
                    <th className="px-3 py-2 text-right font-medium">পরিমাণ</th>
                    <th className="px-3 py-2 text-right font-medium">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courseOrders.slice(0, 20).map((o) => (
                    <tr key={o.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2">{new Date(o.created_at).toLocaleDateString("bn-BD")}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{o.courses?.title}</td>
                      <td className="px-3 py-2 text-right">৳{Number(o.amount).toLocaleString("bn-BD")}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${o.status === "approved" ? "bg-green-100 text-green-700" : o.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {o.status === "approved" ? "✓" : o.status === "rejected" ? "✗" : "⏳"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-red-500" />
              বই অর্ডার বিশ্লেষণ ({periodLabel})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => exportCSV("book")}>
              <Download className="mr-1 h-3 w-3" />CSV ডাউনলোড
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{bookStats.orders}</p>
              <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
            </div>
            <div className="rounded-lg border bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{bookStats.approved}</p>
              <p className="text-xs text-muted-foreground">অ্যাপ্রুভড</p>
            </div>
            <div className="rounded-lg border bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">৳{bookStats.revenue.toLocaleString("bn-BD")}</p>
              <p className="text-xs text-muted-foreground">আয়</p>
            </div>
          </div>
          {/* Recent orders */}
          {bookOrders.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">তারিখ</th>
                    <th className="px-3 py-2 text-left font-medium">বই</th>
                    <th className="px-3 py-2 text-right font-medium">পরিমাণ</th>
                    <th className="px-3 py-2 text-right font-medium">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookOrders.slice(0, 20).map((o) => (
                    <tr key={o.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2">{new Date(o.created_at).toLocaleDateString("bn-BD")}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{o.books?.title}</td>
                      <td className="px-3 py-2 text-right">৳{Number(o.amount).toLocaleString("bn-BD")}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${o.status === "approved" ? "bg-green-100 text-green-700" : o.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {o.status === "approved" ? "✓" : o.status === "rejected" ? "✗" : "⏳"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
