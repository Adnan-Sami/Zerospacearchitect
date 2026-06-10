"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [bookOrders, setBookOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [tab, setTab] = useState<"course" | "book">("course");
  const [page, setPage] = useState(0);
  const [pendingCourseCount, setPendingCourseCount] = useState(0);
  const [pendingBookCount, setPendingBookCount] = useState(0);
  const PAGE_SIZE = 3;

  const loadOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    if (filter !== "all")
      query = query.eq(
        "status",
        filter as "pending" | "approved" | "rejected"
      );
    const { data, error } = await query;
    if (error) {
      setOrders([]);
      return;
    }
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      profileMap = Object.fromEntries(
        (profs ?? []).map((p: any) => [p.user_id, p])
      );
    }
    setOrders(rows.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] })));
  };

  const loadBookOrders = async () => {
    let query = supabase
      .from("book_orders")
      .select("*, books(title, book_type)")
      .order("created_at", { ascending: false });
    if (filter === "dispatched") {
      query = query.eq("delivery_status", "dispatched");
    } else if (filter === "delivered") {
      query = query.eq("delivery_status", "delivered");
    } else if (filter !== "all") {
      query = query.eq("status", filter as "pending" | "approved" | "rejected");
    }
    const { data, error } = await query;
    if (error) {
      setBookOrders([]);
      return;
    }
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      profileMap = Object.fromEntries(
        (profs ?? []).map((p: any) => [p.user_id, p])
      );
    }
    setBookOrders(rows.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] })));
  };

  useEffect(() => {
    if (tab === "course") loadOrders();
    else loadBookOrders();
    // Fetch pending counts
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending").then(({ count }) => setPendingCourseCount(count ?? 0));
    supabase.from("book_orders").select("*", { count: "exact", head: true }).eq("status", "pending").then(({ count }) => setPendingBookCount(count ?? 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, tab]);

  const updateStatus = async (
    orderId: string,
    status: string,
    userId: string,
    courseId: string
  ) => {
    await supabase
      .from("orders")
      .update({ status: status as "pending" | "approved" | "rejected" })
      .eq("id", orderId);
    if (status === "approved") {
      await supabase
        .from("enrollments")
        .upsert({ user_id: userId, course_id: courseId });

      const { data: courseData } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "কোর্স অ্যাক্সেস পেয়েছেন",
        message: `"${courseData?.title}" কোর্সে আপনার অ্যাক্সেস দেওয়া হয়েছে। এখনই শুরু করুন!`,
        type: "order",
        link: `/learn/${courseId}`,
      });
    }
    if (status === "rejected") {
      const { data: courseData } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "আপনার অর্ডার রিজেক্ট হয়েছে",
        message: `"${courseData?.title}" কোর্সের অর্ডার রিজেক্ট করা হয়েছে। সমস্যা থাকলে যোগাযোগ করুন।`,
        type: "order",
        link: "/dashboard",
      });
    }
    loadOrders();
  };

  const updateBookOrderStatus = async (
    orderId: string,
    status: string,
    userId: string | null,
    bookTitle: string,
    deliveryStatus?: string
  ) => {
    const updatePayload: any = { status };
    if (deliveryStatus) updatePayload.delivery_status = deliveryStatus;

    await supabase
      .from("book_orders")
      .update(updatePayload)
      .eq("id", orderId);

    // Send notifications if user exists
    if (userId) {
      let notifTitle = "";
      let notifMessage = "";
      if (status === "approved" && !deliveryStatus) {
        notifTitle = "বই অর্ডার অ্যাপ্রুভড";
        notifMessage = `"${bookTitle}" বইয়ের অর্ডার অ্যাপ্রুভ করা হয়েছে। শীঘ্রই ডেলিভারি হবে।`;
      } else if (deliveryStatus === "dispatched") {
        notifTitle = "বই ডেলিভারিতে পাঠানো হয়েছে";
        notifMessage = `"${bookTitle}" বই কুরিয়ারে পাঠানো হয়েছে। শীঘ্রই পৌঁছাবে।`;
      } else if (deliveryStatus === "delivered") {
        notifTitle = "বই ডেলিভার্ড";
        notifMessage = `"${bookTitle}" বই সফলভাবে ডেলিভারি হয়েছে। ধন্যবাদ!`;
      } else if (status === "rejected") {
        notifTitle = "বই অর্ডার রিজেক্ট";
        notifMessage = `"${bookTitle}" বইয়ের অর্ডার রিজেক্ট করা হয়েছে।`;
      }
      if (notifTitle) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: notifTitle,
          message: notifMessage,
          type: "book_order",
          link: "/dashboard",
        });
      }
    }
    loadBookOrders();
  };

  const deliveryStatusBadge = (status: string, deliveryStatus?: string) => {
    if (status === "rejected") return <Badge variant="destructive">রিজেক্টেড</Badge>;
    if (deliveryStatus === "delivered") return <Badge className="bg-emerald-100 text-emerald-800">📦 ডেলিভার্ড</Badge>;
    if (deliveryStatus === "dispatched") return <Badge className="bg-blue-100 text-blue-800">🚚 ডিসপ্যাচড</Badge>;
    if (status === "approved") return <Badge className="bg-green-100 text-green-800">✅ অ্যাপ্রুভড</Badge>;
    return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />পেন্ডিং</Badge>;
  };

  const statusBadge = (status: string) => {
    if (status === "approved")
      return (
        <Badge className="bg-green-100 text-green-800">অ্যাপ্রুভড</Badge>
      );
    if (status === "rejected")
      return <Badge variant="destructive">রিজেক্টেড</Badge>;
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />পেন্ডিং
      </Badge>
    );
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>

      {/* Header card with tabs + filters */}
      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        {/* Tab toggle */}
        <div className="mb-3 flex gap-1 rounded-full border bg-muted/50 p-1 w-fit">
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "course" ? "bg-sky-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("course"); setFilter("pending"); setPage(0); }}
          >
            📚 কোর্স অর্ডার {pendingCourseCount > 0 && <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{pendingCourseCount}</span>}
          </button>
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "book" ? "bg-sky-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("book"); setFilter("pending"); setPage(0); }}
          >
            📖 বই অর্ডার {pendingBookCount > 0 && <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{pendingBookCount}</span>}
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { v: "pending", l: "⏳ পেন্ডিং" },
            { v: "approved", l: "✅ অ্যাপ্রুভড" },
            { v: "rejected", l: "❌ রিজেক্টেড" },
            { v: "all", l: "সব" },
          ].map((f) => (
          <Button
            key={f.v}
            variant={filter === f.v ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(f.v); setPage(0); }}
          >
            {f.l}
          </Button>
        ))}
        {tab === "book" && (
          <>
            <Button variant={filter === "dispatched" ? "default" : "outline"} size="sm" onClick={() => { setFilter("dispatched"); setPage(0); }}>🚚 ডিসপ্যাচড</Button>
            <Button variant={filter === "delivered" ? "default" : "outline"} size="sm" onClick={() => { setFilter("delivered"); setPage(0); }}>📦 ডেলিভার্ড</Button>
          </>
        )}
        </div>
      </div>

      {/* Course orders */}
      {tab === "course" && (
        <div className="space-y-3">
          {orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Order Info */}
                  <div className="flex-1 p-4 md:p-5">
                    <h3 className="font-bold text-foreground">{order.courses?.title}</h3>
                    <div className="mt-2 grid gap-1.5 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">শিক্ষার্থী</span>
                        <span className="font-medium">{order.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">ফোন</span>
                        <span className="font-medium">{order.profiles?.phone}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">পেমেন্ট ফোন</span>
                        <span className="font-medium">{order.payment_phone}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">শেষ ৪ ডিজিট</span>
                        <span className="font-mono font-bold text-sky-600">{order.transaction_id}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">মাধ্যম</span>
                        <span className="font-medium capitalize">{order.payment_method}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">পরিমাণ</span>
                        <span className="font-bold text-green-600 tabular-nums">৳{Number(order.amount).toLocaleString("bn-BD")}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[80px]">তারিখ</span>
                        <span className="tabular-nums">{new Date(order.created_at).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                    <div className="mt-3">{statusBadge(order.status)}</div>
                  </div>
                  {/* Action Buttons */}
                  {order.status === "pending" && (
                    <div className="flex items-center gap-2 border-t p-4 md:border-l md:border-t-0 md:p-5">
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "approved",
                            order.user_id,
                            order.course_id
                          )
                        }
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />অ্যাপ্রুভ
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "rejected",
                            order.user_id,
                            order.course_id
                          )
                        }
                      >
                        <XCircle className="mr-1 h-4 w-4" />রিজেক্ট
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && (
            <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>
          )}
          {/* Pagination */}
          {orders.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, orders.length)} / {orders.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>পূর্ববর্তী</Button>
                <Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= orders.length} onClick={() => setPage(page + 1)}>পরবর্তী</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book orders */}
      {tab === "book" && (
        <div className="space-y-3">
          {bookOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4 md:p-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{order.books?.title}</h3>
                      {order.user_id
                        ? <Badge className="bg-sky-100 text-sky-700 text-[10px]">এনরোল্ড</Badge>
                        : <Badge className="bg-orange-100 text-orange-700 text-[10px]">গেস্ট</Badge>
                      }
                    </div>
                    <div className="mt-2 grid gap-1.5 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">গ্রাহক</span>
                        <span className="font-medium">{order.customer_name || order.profiles?.full_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">ফোন</span>
                        <span className="font-medium">{order.customer_phone || order.profiles?.phone || "—"}</span>
                      </div>
                      {order.delivery_address && (
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground min-w-[90px]">ঠিকানা</span>
                          <span className="font-medium">{order.delivery_address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">পেমেন্ট ফোন</span>
                        <span className="font-medium">{order.payment_phone}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">শেষ ৪ ডিজিট</span>
                        <span className="font-mono font-bold text-sky-600">{order.transaction_id}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">মাধ্যম</span>
                        <span className="font-medium capitalize">{order.payment_method || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">ধরন</span>
                        <span className="font-medium">{order.books?.book_type === "pdf" ? "PDF" : "হার্ডকপি"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">পরিমাণ</span>
                        <span className="font-bold text-green-600 tabular-nums">৳{Number(order.amount).toLocaleString("bn-BD")}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground min-w-[90px]">তারিখ</span>
                        <span className="tabular-nums">{new Date(order.created_at).toLocaleDateString("bn-BD")}</span>
                      </div>
                      {order.order_note && (
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground min-w-[90px]">বার্তা</span>
                          <span className="text-muted-foreground">{order.order_note}</span>
                        </div>
                      )}
                      {order.invoice_number && (
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground min-w-[90px]">ইনভয়েস</span>
                          <span className="font-mono text-xs">{order.invoice_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">{deliveryStatusBadge(order.status, order.delivery_status)}</div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 border-t p-4 md:border-l md:border-t-0 md:p-5">
                    {order.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => updateBookOrderStatus(order.id, "approved", order.user_id, order.books?.title ?? "")}>
                          <CheckCircle className="mr-1 h-4 w-4" />অ্যাপ্রুভ
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateBookOrderStatus(order.id, "rejected", order.user_id, order.books?.title ?? "")}>
                          <XCircle className="mr-1 h-4 w-4" />রিজেক্ট
                        </Button>
                      </div>
                    )}
                    {order.status === "approved" && order.delivery_status !== "dispatched" && order.delivery_status !== "delivered" && order.books?.book_type !== "pdf" && (
                      <Button size="sm" variant="outline" onClick={() => updateBookOrderStatus(order.id, "approved", order.user_id, order.books?.title ?? "", "dispatched")}>
                        🚚 ডিসপ্যাচ
                      </Button>
                    )}
                    {order.delivery_status === "dispatched" && (
                      <Button size="sm" variant="outline" onClick={() => updateBookOrderStatus(order.id, "approved", order.user_id, order.books?.title ?? "", "delivered")}>
                        📦 ডেলিভার্ড
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {bookOrders.length === 0 && (
            <p className="text-muted-foreground">কোনো বই অর্ডার নেই।</p>
          )}
          {/* Pagination */}
          {bookOrders.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, bookOrders.length)} / {bookOrders.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>পূর্ববর্তী</Button>
                <Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= bookOrders.length} onClick={() => setPage(page + 1)}>পরবর্তী</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
