import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pages")({
  component: AdminPages,
});

function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("custom_pages").select("*").order("created_at", { ascending: false });
    setPages(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title || !editing.slug) { toast.error("শিরোনাম ও slug দিন"); return; }
    const slug = editing.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...editing, slug };
    if (editing.id) {
      await supabase.from("custom_pages").update(payload).eq("id", editing.id);
    } else {
      delete payload.id;
      const { error } = await supabase.from("custom_pages").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    setOpen(false); load(); toast.success("সেভ হয়েছে");
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট করতে চান?")) return;
    await supabase.from("custom_pages").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">কাস্টম পেজ</h1>
        <Button onClick={() => { setEditing({ title: "", slug: "", content: "", is_published: true }); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />নতুন পেজ
        </Button>
      </div>

      <div className="space-y-2">
        {pages.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">/{p.slug} · {p.is_published ? "✅ পাবলিশড" : "🔒 ড্রাফট"}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>
                <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {pages.length === 0 && <p className="text-muted-foreground">কোনো পেজ নেই</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "পেজ এডিট" : "নতুন পেজ"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>শিরোনাম</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Slug (URL)</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="about-us" /></div>
              <div><Label>কন্টেন্ট (HTML সাপোর্টেড)</Label><Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={12} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>পাবলিশড</Label>
              </div>
              <Button onClick={save} className="w-full"><Save className="mr-1 h-4 w-4" />সেভ করুন</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
