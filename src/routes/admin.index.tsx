import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, BookOpen, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: students }, { count: courses }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("amount, status"),
      ]);
      const approvedOrders = orders?.filter(o => o.status === "approved") ?? [];
      const revenue = approvedOrders.reduce((s, o) => s + Number(o.amount), 0);
      setStats({
        students: students ?? 0,
        courses: courses ?? 0,
        orders: orders?.length ?? 0,
        revenue,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "মোট শিক্ষার্থী", value: stats.students, icon: Users, color: "text-blue-500" },
    { label: "মোট কোর্স", value: stats.courses, icon: BookOpen, color: "text-green-500" },
    { label: "মোট অর্ডার", value: stats.orders, icon: ShoppingCart, color: "text-orange-500" },
    { label: "মোট আয়", value: `৳${stats.revenue.toLocaleString("bn-BD")}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
