import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("pending");

  const loadOrders = async () => {
    let query = supabase.from("orders").select("*, courses(title)").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as "pending" | "approved" | "rejected");
    const { data, error } = await query;
    if (error) { console.error("orders load error", error); setOrders([]); return; }
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p]));
    }
    setOrders(rows.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] })));
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const updateStatus = async (orderId: string, status: string, userId: string, courseId: string) => {
    await supabase.from("orders").update({ status: status as "pending" | "approved" | "rejected" }).eq("id", orderId);
    if (status === "approved") {
      // Create enrollment
      await supabase.from("enrollments").upsert({ user_id: userId, course_id: courseId });
    }
    loadOrders();
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-800">অ্যাপ্রুভড</Badge>;
    if (status === "rejected") return <Badge variant="destructive">রিজেক্টেড</Badge>;
    return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />পেন্ডিং</Badge>;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>
      <div className="mb-4 flex gap-2">
        {[{ v: "pending", l: "পেন্ডিং" }, { v: "approved", l: "অ্যাপ্রুভড" }, { v: "rejected", l: "রিজেক্টেড" }, { v: "all", l: "সব" }].map(f => (
          <Button key={f.v} variant={filter === f.v ? "default" : "outline"} size="sm" onClick={() => setFilter(f.v)}>{f.l}</Button>
        ))}
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">{order.courses?.title}</h3>
                  <p className="text-sm text-muted-foreground">শিক্ষার্থী: {order.profiles?.full_name} · ফোন: {order.profiles?.phone}</p>
                  <p className="text-sm text-muted-foreground">পেমেন্ট ফোন: {order.payment_phone} · ট্রান্স. আইডি: {order.transaction_id}</p>
                  <p className="text-sm text-muted-foreground">মাধ্যম: {order.payment_method} · পরিমাণ: ৳{Number(order.amount)}</p>
                  <div className="mt-1">{statusBadge(order.status)}</div>
                </div>
                {order.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(order.id, "approved", order.user_id, order.course_id)}>
                      <CheckCircle className="mr-1 h-4 w-4" />অ্যাপ্রুভ
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "rejected", order.user_id, order.course_id)}>
                      <XCircle className="mr-1 h-4 w-4" />রিজেক্ট
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>}
      </div>
    </div>
  );
}
