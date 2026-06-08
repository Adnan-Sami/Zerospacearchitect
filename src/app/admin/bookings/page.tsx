"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Calendar, Eye, CheckCircle, Clock, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Booking = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  project_location: string | null;
  service_type: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "completed">("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("service_requests")
      .select("*")
      .ilike("service_type", "%কনসালটেন্সি%")
      .order("created_at", { ascending: false });

    if (filter === "new") {
      query = query.or("status.eq.new,status.is.null");
    } else if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("আপডেট করতে সমস্যা হয়েছে");
      return;
    }
    toast.success(`স্ট্যাটাস "${status === "contacted" ? "যোগাযোগ করা হয়েছে" : status === "completed" ? "সম্পন্ন" : "নতুন"}" আপডেট হয়েছে`);
    load();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, status } : null);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("এই বুকিং ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("service_requests").delete().eq("id", id);
    if (error) {
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
      return;
    }
    toast.success("ডিলিট হয়েছে");
    setSelected(null);
    load();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">📞 যোগাযোগ করা হয়েছে</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✅ সম্পন্ন</Badge>;
      case "new":
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">🆕 নতুন</Badge>;
    }
  };

  const stats = {
    total: bookings.length,
    new: bookings.filter((b) => b.status === "new" || !b.status).length,
    contacted: bookings.filter((b) => b.status === "contacted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">কনসালটেন্সি বুকিং</h1>
          <p className="text-sm text-muted-foreground">গ্রাহকদের কনসালটেন্সি বুকিং রিকোয়েস্ট দেখুন ও ম্যানেজ করুন</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setFilter("all")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">মোট বুকিং</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-yellow-200 transition-shadow hover:shadow-md" onClick={() => setFilter("new")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.new}</p>
            <p className="text-xs text-muted-foreground">নতুন (পেন্ডিং)</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-blue-200 transition-shadow hover:shadow-md" onClick={() => setFilter("contacted")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
            <p className="text-xs text-muted-foreground">যোগাযোগ করা হয়েছে</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-green-200 transition-shadow hover:shadow-md" onClick={() => setFilter("completed")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">সম্পন্ন</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2">
        {([
          { v: "all" as const, l: "সব" },
          { v: "new" as const, l: "নতুন" },
          { v: "contacted" as const, l: "যোগাযোগ করা হয়েছে" },
          { v: "completed" as const, l: "সম্পন্ন" },
        ]).map((f) => (
          <Button
            key={f.v}
            size="sm"
            variant={filter === f.v ? "default" : "outline"}
            onClick={() => setFilter(f.v)}
          >
            {f.l}
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : bookings.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">কোনো বুকিং পাওয়া যায়নি</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${selected?.id === booking.id ? "ring-2 ring-sky-500" : ""}`}
              onClick={() => setSelected(booking)}
            >
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
                  {booking.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{booking.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.service_type} · {new Date(booking.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(booking.status)}
                  <a href={`tel:${booking.phone}`} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="h-8">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b bg-sky-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">বুকিং বিস্তারিত</CardTitle>
                {getStatusBadge(selected.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
                  {selected.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-lg font-bold">{selected.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selected.service_type}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${selected.phone}`} className="font-medium text-sky-600 hover:underline">{selected.phone}</a>
                </div>
                {selected.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selected.email}`} className="text-sky-600 hover:underline">{selected.email}</a>
                  </div>
                )}
                {selected.project_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selected.project_location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(selected.created_at).toLocaleString("bn-BD")}</span>
                </div>
              </div>

              {selected.message && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> বার্তা:
                  </p>
                  <p className="whitespace-pre-line text-sm">{selected.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {selected.status !== "contacted" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateStatus(selected.id, "contacted")}
                  >
                    <Phone className="mr-1 h-3.5 w-3.5" />যোগাযোগ করা হয়েছে
                  </Button>
                )}
                {selected.status !== "completed" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus(selected.id, "completed")}
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />সম্পন্ন
                  </Button>
                )}
                {selected.status !== "new" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selected.id, "new")}
                  >
                    <Clock className="mr-1 h-3.5 w-3.5" />নতুন হিসেবে চিহ্নিত করুন
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteBooking(selected.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />ডিলিট
                </Button>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>বন্ধ করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
