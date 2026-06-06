"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminTestimonials() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name || !editing.comment) {
      toast.error("নাম ও মন্তব্য দিন");
      return;
    }
    const payload = {
      name: editing.name,
      role: editing.role ?? "",
      comment: editing.comment,
      avatar_url: editing.avatar_url ?? "",
      rating: Number(editing.rating) || 5,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
      : await supabase.from("testimonials").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">টেস্টিমোনিয়াল</h1>
        <Button onClick={() => setEditing({ is_active: true, rating: 5, sort_order: 0 })}>
          <Plus className="mr-1 h-4 w-4" />নতুন
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing.id ? "এডিট" : "নতুন"} টেস্টিমোনিয়াল</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>নাম</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>পেশা/ভূমিকা</Label><Input value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></div>
            <div><Label>মন্তব্য</Label><Textarea value={editing.comment ?? ""} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} /></div>
            <div><Label>অ্যাভাটার URL</Label><Input value={editing.avatar_url ?? ""} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} /></div>
            <div><Label>রেটিং (১-৫)</Label><Input type="number" min={1} max={5} value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} /></div>
            <div><Label>সাজানোর ক্রম</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>অ্যাক্টিভ</Label></div>
            <div className="flex gap-2"><Button onClick={save}>সেভ করুন</Button><Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button></div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold">{t.name} <span className="text-xs text-muted-foreground">— {t.role}</span></p>
                <p className="text-sm text-muted-foreground">&ldquo;{t.comment}&rdquo;</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(t)}><Edit className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground">কোনো টেস্টিমোনিয়াল নেই।</p>}
      </div>
    </div>
  );
}
