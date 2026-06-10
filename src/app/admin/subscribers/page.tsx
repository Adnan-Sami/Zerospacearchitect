"use client";

import { useEffect, useState } from "react";
import { Download, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toBn } from "@/lib/utils";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [listPage, setListPage] = useState(0);
  const LIST_PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"all" | "this_month" | "last_month" | "this_year">("all");

  const load = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscribers(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = subscribers.filter((s) => {
    if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    const now = new Date();
    const joined = new Date(s.created_at);
    if (period === "this_month") return joined >= new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return joined >= start && joined < end;
    }
    if (period === "this_year") return joined >= new Date(now.getFullYear(), 0, 1);
    return true;
  });

  const deleteSubscriber = async (id: string) => {
    await supabase.from("subscribers").delete().eq("id", id);
    load();
  };

  const exportCSV = () => {
    const headers = ["ইমেইল", "তারিখ"];
    const rows = filtered.map((s) => [
      s.email,
      new Date(s.created_at).toLocaleDateString("bn-BD"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "subscribers.csv";
    link.click();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">সাবস্ক্রাইবার তালিকা ({toBn(filtered.length)})</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="mr-1 h-3 w-3" />CSV ডাউনলোড
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm space-y-3">
        <Input
          placeholder="ইমেইল দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {([
            { v: "all" as const, l: "সব" },
            { v: "this_month" as const, l: "এই মাস" },
            { v: "last_month" as const, l: "গত মাস" },
            { v: "this_year" as const, l: "এই বছর" },
          ]).map((p) => (
            <Button
              key={p.v}
              size="sm"
              variant={period === p.v ? "default" : "outline"}
              className={period === p.v ? "bg-sky-600 hover:bg-sky-700" : ""}
              onClick={() => setPeriod(p.v)}
            >
              {p.l}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE).map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                  <Mail className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{s.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("bn-BD")}
                    {s.contacted && <span className="ml-2 text-green-600">✓ যোগাযোগ হয়েছে</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={s.contacted ? "outline" : "default"}
                  className={`h-7 text-xs ${!s.contacted ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={async () => {
                    await supabase.from("subscribers").update({ contacted: !s.contacted }).eq("id", s.id);
                    load();
                  }}
                >
                  {s.contacted ? "আনমার্ক" : "✓ যোগাযোগ হয়েছে"}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSubscriber(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
          {filtered.length > LIST_PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {listPage * LIST_PAGE_SIZE + 1}–{Math.min((listPage + 1) * LIST_PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={listPage === 0} onClick={() => setListPage(listPage - 1)}>পূর্ববর্তী</Button>
                <Button size="sm" variant="outline" disabled={(listPage + 1) * LIST_PAGE_SIZE >= filtered.length} onClick={() => setListPage(listPage + 1)}>পরবর্তী</Button>
              </div>
            </div>
          )}
          {subscribers.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">কোনো সাবস্ক্রাইবার নেই।</p>
        )}
      </div>
    </div>
  );
}
