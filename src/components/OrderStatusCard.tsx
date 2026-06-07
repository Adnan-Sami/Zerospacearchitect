"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  course_id: string;
  amount: number;
  status: string;
  created_at: string;
  courses: { title: string } | null;
}

export function OrderStatusCard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("id, course_id, amount, status, created_at, courses(title)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setOrders((data as Order[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading || orders.length === 0) return null;

  const statusBadge = (status: string) => {
    if (status === "approved")
      return <Badge className="bg-green-100 text-green-800">অ্যাপ্রুভড</Badge>;
    if (status === "rejected")
      return <Badge variant="destructive">রিজেক্টেড</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">পেন্ডিং</Badge>;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">আমার অর্ডারসমূহ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{order.courses?.title}</p>
                <p className="text-xs text-muted-foreground">
                  ৳{Number(order.amount).toLocaleString("bn-BD")} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("bn-BD")}
                </p>
              </div>
              {statusBadge(order.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
