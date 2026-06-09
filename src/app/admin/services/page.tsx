"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";export default function AdminServices() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("design_services").select("*").order("sort_order");
    setItems(data ?? []);
    const { data: g } = await supabase.from("design_gallery").select("*").order("sort_order");
    setGallery(g ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title?.trim()) { toast.error("সার্ভিসের নাম দিন"); return; }
    const payload = {
      title: editing.title.trim(),
      description: editing.description?.trim() ?? "",
      details: editing.details?.trim() ?? "",
      image_url: editing.image_url?.trim() ?? "",
      price: editing.price?.trim() || (editing.price_min && editing.price_max ? `৳${editing.price_min} — ৳${editing.price_max}` : editing.price_min ? `৳${editing.price_min} থেকে শুরু` : ""),
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("design_services").update(payload).eq("id", editing.id)
      : await supabase.from("design_services").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("design_services").delete().eq("id", id);
    load();
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, { folder: "services" });
      setEditing((p: any) => ({ ...p, image_url: url }));
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    }
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ডিজাইন সার্ভিস ম্যানেজমেন্ট</h1>
        <Button onClick={() => setEditing({ is_active: true, sort_order: 0 })}><Plus className="mr-1 h-4 w-4" />নতুন সার্ভিস</Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing.id ? "এডিট" : "নতুন"} সার্ভিস</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>সার্ভিসের নাম *</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>সংক্ষিপ্ত বর্ণনা</Label><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><Label>বিস্তারিত</Label><Textarea rows={4} value={editing.details ?? ""} onChange={(e) => setEditing({ ...editing, details: e.target.value })} /></div>
            <div><Label>মূল্য / রেঞ্জ</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Input value={editing.price_min ?? ""} onChange={(e) => setEditing({ ...editing, price_min: e.target.value })} placeholder="শুরু: ৫০০০" />
                <Input value={editing.price_max ?? ""} onChange={(e) => setEditing({ ...editing, price_max: e.target.value })} placeholder="পর্যন্ত: ১০০০০০" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">অথবা সিঙ্গেল প্রাইস:</p>
              <Input value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value })} placeholder="যেমন: ৳৫,০০০ থেকে শুরু" className="mt-1" />
            </div>
            <div>
              <Label>ছবি আপলোড</Label>
              <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              {editing.image_url && <Image src={editing.image_url} alt="" width={200} height={120} className="mt-2 h-24 rounded object-cover" />}
            </div>
            <div><Label>সাজানোর ক্রম</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>অ্যাক্টিভ</Label></div>
            <div className="flex gap-2"><Button onClick={save}>সেভ করুন</Button><Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button></div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {s.image_url && <Image src={s.image_url} alt="" width={80} height={56} className="h-14 w-20 rounded object-cover" />}
              <div className="flex-1">
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.price || "—"} · {s.is_active ? "✅ অ্যাক্টিভ" : "🔒 নিষ্ক্রিয়"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(s)}><Edit className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground">কোনো সার্ভিস নেই।</p>}
      </div>

      {/* Gallery Management */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">গ্যালারি (আমাদের কাজ)</h2>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" disabled={galleryUploading} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setGalleryUploading(true);
              try {
                const url = await uploadFile(file, { folder: "gallery" });
                await supabase.from("design_gallery").insert({ image_url: url, sort_order: gallery.length });
                toast.success("ছবি যোগ হয়েছে");
              } catch (err: any) {
                toast.error(err.message || "আপলোড ব্যর্থ");
              }
              setGalleryUploading(false);
              load();
            }} />
            <Button asChild variant="outline" disabled={galleryUploading}>
              <span>{galleryUploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}ছবি আপলোড</span>
            </Button>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg">
              <Image src={img.image_url} alt={img.title || ""} width={200} height={150} className="h-32 w-full object-cover" />
              <button
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                onClick={async () => { await supabase.from("design_gallery").delete().eq("id", img.id); load(); }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {gallery.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">গ্যালারিতে কোনো ছবি নেই।</p>}
        </div>
      </div>
    </div>
  );
}
