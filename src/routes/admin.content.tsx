import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, Search, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteContent } from "@/hooks/use-site-content";
import { CONTENT_REGISTRY, REGISTRY_BY_KEY, type ContentItem } from "@/content/registry";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

type Row = ContentItem & { value: string; saved: boolean };

function AdminContent() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("site_content").select("key,value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => { map[r.key] = r.value ?? ""; });
    setOverrides(map);
  };
  useEffect(() => { load(); }, []);

  const rows: Row[] = useMemo(() => CONTENT_REGISTRY.map((i) => ({
    ...i,
    value: overrides[i.key] ?? i.defaultValue,
    saved: overrides[i.key] !== undefined,
  })), [overrides]);

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};
    rows
      .filter((r) =>
        !search ||
        r.key.toLowerCase().includes(search.toLowerCase()) ||
        r.label.toLowerCase().includes(search.toLowerCase()) ||
        r.value.toLowerCase().includes(search.toLowerCase()) ||
        r.page.includes(search)
      )
      .forEach((r) => {
        if (!map[r.page]) map[r.page] = [];
        map[r.page].push(r);
      });
    return map;
  }, [rows, search]);

  const save = async () => {
    if (!editing) return;
    const payload = { key: editing.key, value: editing.value ?? "", description: editing.label };
    const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "key" });
    if (error) { toast.error(error.message); return; }
    invalidateSiteContent();
    toast.success("সেভ হয়েছে");
    setOpen(false);
    load();
  };

  const reset = async (key: string) => {
    if (!confirm("ডিফল্ট ভ্যালুতে রিসেট করবেন?")) return;
    await supabase.from("site_content").delete().eq("key", key);
    invalidateSiteContent();
    load();
  };

  const handleUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `site-content/${editing.key.replace(/\./g, "_")}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setEditing({ ...editing, value: data.publicUrl });
    setUploading(false);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">সাইট কন্টেন্ট</h1>
        <p className="text-sm text-muted-foreground">
          হোম, কোর্স, বই, ডিজাইন ও কনসালটেন্সি, সাপোর্ট — সব পেজের টেক্সট ও ছবি এখানে এডিট করুন।
        </p>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="পেজ, লেবেল, বা টেক্সট সার্চ..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([page, items]) => (
          <div key={page}>
            <h2 className="mb-2 text-lg font-bold text-primary">{page} পেজ</h2>
            <div className="space-y-2">
              {items.map((r) => (
                <Card key={r.key}>
                  <CardContent className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{r.label} {r.saved && <span className="ml-2 rounded bg-green-100 px-2 text-xs text-green-700">কাস্টম</span>}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{r.key}</p>
                      {r.type === "image" ? (
                        r.value ? <img src={r.value} alt="" className="mt-1 h-16 rounded object-cover" /> : <p className="mt-1 text-xs italic text-muted-foreground">ছবি নেই</p>
                      ) : (
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm">{r.value || <span className="italic text-muted-foreground">খালি</span>}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setEditing({ ...r }); setOpen(true); }}>এডিট</Button>
                      {r.saved && <Button size="sm" variant="ghost" onClick={() => reset(r.key)} title="ডিফল্টে রিসেট"><RotateCcw className="h-4 w-4" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.label} এডিট</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-muted-foreground">{editing.key}</p>
              {editing.type === "image" ? (
                <>
                  <Label>ছবি URL</Label>
                  <Input value={editing.value ?? ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} placeholder="https://..." />
                  <div>
                    <Label className="mb-1 block">অথবা আপলোড করুন</Label>
                    <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    {uploading && <p className="mt-1 text-xs text-muted-foreground"><Upload className="inline h-3 w-3 animate-pulse" /> আপলোড হচ্ছে...</p>}
                  </div>
                  {editing.value && <img src={editing.value} alt="" className="max-h-48 rounded border" />}
                </>
              ) : editing.type === "longtext" ? (
                <>
                  <Label>টেক্সট</Label>
                  <Textarea value={editing.value ?? ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} rows={6} />
                </>
              ) : (
                <>
                  <Label>টেক্সট</Label>
                  <Input value={editing.value ?? ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
                </>
              )}
              <p className="text-xs text-muted-foreground">ডিফল্ট: {REGISTRY_BY_KEY[editing.key]?.defaultValue || "(খালি)"}</p>
              <Button onClick={save} className="w-full" disabled={uploading}><Save className="mr-1 h-4 w-4" />সেভ করুন</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
