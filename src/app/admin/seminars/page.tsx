"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Loader2, Users, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toBn } from "@/lib/utils";
import { uploadFile } from "@/lib/upload";

export default function AdminSeminars() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [showRegs, setShowRegs] = useState<string | null>(null);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [listPage, setListPage] = useState(0);
  const LIST_PAGE_SIZE = 10;

  const load = async () => {
    const { data } = await supabase.from("seminars").select("*").order("sort_order");
    setItems(data ?? []);

    // Fetch registration counts per seminar (only unseen)
    const { data: allRegs } = await supabase.from("seminar_registrations").select("seminar_id, created_at");
    const counts: Record<string, number> = {};
    (allRegs ?? []).forEach((r: any) => {
      if (r.seminar_id) {
        const lastSeen = localStorage.getItem(`seminar_regs_seen_${r.seminar_id}`) || "2000-01-01";
        if (new Date(r.created_at) > new Date(lastSeen)) {
          counts[r.seminar_id] = (counts[r.seminar_id] || 0) + 1;
        }
      }
    });
    setRegCounts(counts);
  };

  useEffect(() => {
    load();
    // Mark seminar registrations as seen
    localStorage.setItem("seminar_last_seen", new Date().toISOString());
  }, []);

  const save = async () => {
    if (!editing?.title?.trim()) { toast.error("টাইটেল দিন"); return; }
    const payload = {
      title: editing.title.trim(),
      description: editing.description?.trim() || "",
      image_url: editing.image_url?.trim() || "",
      link_url: editing.is_upcoming ? null : (editing.link_url?.trim() || null),
      is_upcoming: editing.is_upcoming ?? false,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
      deadline: editing.is_upcoming && editing.deadline ? editing.deadline : null,
    };

    const { error } = editing.id
      ? await supabase.from("seminars").update(payload).eq("id", editing.id)
      : await supabase.from("seminars").insert(payload);

    if (error) { toast.error(error.message); return; }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("seminars").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    load();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, { folder: "seminars" });
      setEditing((prev: any) => ({ ...prev, image_url: url }));
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    }
    setUploading(false);
  };

  const viewRegistrations = async (seminarId: string) => {
    setShowRegs(seminarId);
    const { data } = await supabase
      .from("seminar_registrations")
      .select("*")
      .eq("seminar_id", seminarId)
      .order("created_at", { ascending: false });
    setRegistrations(data ?? []);
    // Mark this seminar's registrations as seen
    localStorage.setItem(`seminar_regs_seen_${seminarId}`, new Date().toISOString());
    setRegCounts((prev) => ({ ...prev, [seminarId]: 0 }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">সেমিনার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">সেমিনার ও ওয়েবিনার যোগ/এডিট করুন</p>
        </div>
        <Button onClick={() => setEditing({ is_active: true, is_upcoming: false, sort_order: items.length })}>
          <Plus className="mr-1 h-4 w-4" />নতুন সেমিনার
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing.id ? "এডিট" : "নতুন"} সেমিনার</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>টাইটেল *</Label>
              <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="সেমিনারের নাম" />
            </div>
            <div>
              <Label>বিবরণ</Label>
              <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="সেমিনার সম্পর্কে বিস্তারিত..." />
            </div>
            <div>
              <Label>লিংক URL (YouTube/Zoom — পূর্ববর্তী সেমিনারের ভিডিও লিংক)</Label>
              <Input
                value={editing.link_url ?? ""}
                onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                placeholder="https://..."
                disabled={editing.is_upcoming}
              />
              {editing.is_upcoming && <p className="mt-1 text-[10px] text-muted-foreground">আসন্ন সেমিনারে লিংক দেওয়া যাবে না — শুধু পূর্ববর্তী সেমিনারে ভিডিও লিংক দিন।</p>}
            </div>
            {editing.is_upcoming && (
              <div>
                <Label>রেজিস্ট্রেশন শেষ তারিখ ও সময়</Label>
                <Input
                  type="datetime-local"
                  value={editing.deadline ?? ""}
                  onChange={(e) => setEditing({ ...editing, deadline: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">এই সময়ের পর রেজিস্ট্রেশন বন্ধ হবে এবং সেমিনার স্বয়ংক্রিয়ভাবে &quot;পূর্ববর্তী&quot; তে চলে যাবে।</p>
              </div>
            )}
            <div>
              <Label>ছবি আপলোড</Label>
              <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />আপলোড হচ্ছে...</p>}
              {editing.image_url && <Image src={editing.image_url} alt="" width={200} height={150} className="mt-2 h-28 w-auto rounded object-cover" />}
            </div>
            <div>
              <Label>সাজানোর ক্রম</Label>
              <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_upcoming ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_upcoming: v })} />
                <Label>আসন্ন সেমিনার (Upcoming)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>অ্যাক্টিভ</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save}>সেভ করুন</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE).map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {s.image_url && <Image src={s.image_url} alt="" width={80} height={60} className="h-14 w-20 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.is_upcoming ? "🟢 আসন্ন" : "📁 পূর্ববর্তী"} · {s.is_active ? "✅ অ্যাক্টিভ" : "🔒 নিষ্ক্রিয়"} · ক্রম: {toBn(s.sort_order)}
                </p>
              </div>
              {s.is_upcoming && (
                <Button variant="outline" size="sm" className="relative" onClick={() => viewRegistrations(s.id)} title="রেজিস্ট্রেশন দেখুন">
                  <Users className="h-4 w-4" />
                  {(regCounts[s.id] || 0) > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {regCounts[s.id]}
                    </span>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(s)}><Edit className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        
          {items.length > LIST_PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {listPage * LIST_PAGE_SIZE + 1}–{Math.min((listPage + 1) * LIST_PAGE_SIZE, items.length)} / {items.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={listPage === 0} onClick={() => setListPage(listPage - 1)}>পূর্ববর্তী</Button>
                <Button size="sm" variant="outline" disabled={(listPage + 1) * LIST_PAGE_SIZE >= items.length} onClick={() => setListPage(listPage + 1)}>পরবর্তী</Button>
              </div>
            </div>
          )}
          {items.length === 0 && <p className="py-10 text-center text-muted-foreground">কোনো সেমিনার যোগ করা হয়নি।</p>}
      </div>

      {/* Registrations Modal */}
      {showRegs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRegs(null)}>
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">সেমিনার রেজিস্ট্রেশন ({toBn(registrations.length)} জন)</CardTitle>
                <button className="rounded-full p-1 hover:bg-gray-100" onClick={() => setShowRegs(null)}>✕</button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {registrations.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">কোনো রেজিস্ট্রেশন নেই</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="rounded-lg border p-3">
                      <p className="font-semibold">{reg.name}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{reg.phone}</span>
                        {reg.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{reg.email}</span>}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">{new Date(reg.created_at).toLocaleDateString("bn-BD")}, {new Date(reg.created_at).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true })}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
