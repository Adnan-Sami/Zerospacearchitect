import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/slides")({
  component: AdminSlides,
});

function AdminSlides() {
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    setSlides(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title) { toast.error("শিরোনাম দিন"); return; }
    const payload = {
      title: editing.title,
      subtitle: editing.subtitle ?? "",
      image_url: editing.image_url ?? "",
      link_url: editing.link_url ?? "",
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("hero_slides").update(payload).eq("id", editing.id)
      : await supabase.from("hero_slides").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">হিরো স্লাইডার</h1>
        <Button onClick={() => setEditing({ is_active: true, sort_order: 0 })}><Plus className="mr-1 h-4 w-4" />নতুন স্লাইড</Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing.id ? "এডিট" : "নতুন"} স্লাইড</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>শিরোনাম</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>সাব-টাইটেল</Label><Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
            <div><Label>ছবির URL</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
            <div><Label>লিংক URL</Label><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/courses" /></div>
            <div><Label>সাজানোর ক্রম</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>অ্যাক্টিভ</Label></div>
            <div className="flex gap-2"><Button onClick={save}>সেভ করুন</Button><Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button></div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {slides.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {s.image_url && <img src={s.image_url} alt="" className="h-16 w-28 rounded object-cover" />}
              <div className="flex-1">
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(s)}><Edit className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {slides.length === 0 && <p className="text-center text-muted-foreground">কোনো স্লাইড নেই।</p>}
      </div>
    </div>
  );
}
