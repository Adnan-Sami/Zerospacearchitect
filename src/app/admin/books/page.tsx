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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0980-\u09FF-]/g, "")
    .replace(/-+/g, "-");
}

export default function AdminBooks() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("books").select("*").order("sort_order").order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.title?.trim()) {
      toast.error("বইয়ের নাম দিন");
      return;
    }
    const payload = {
      title: editing.title.trim(),
      slug: slugify(editing.title),
      author: editing.author?.trim() ?? "",
      price: Number(editing.price) || 0,
      original_price: editing.original_price ? Number(editing.original_price) : null,
      cover_url: editing.cover_url?.trim() ?? "",
      description: editing.description?.trim() ?? "",
      details: editing.details?.trim() ?? "",
      rating: Number(editing.rating) || 5,
      sort_order: Number(editing.sort_order) || 0,
      is_published: editing.is_published ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("books").update(payload).eq("id", editing.id)
      : await supabase.from("books").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("বই সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("এই বইটি মুছবেন?")) return;
    await supabase.from("books").delete().eq("id", id);
    load();
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ইমেজ ফাইল আপলোড করুন");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `books/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setEditing({ ...editing, cover_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">বই ম্যানেজমেন্ট</h1>
        <Button onClick={() => setEditing({ is_published: true, rating: 5, sort_order: 0, price: 0 })}>
          <Plus className="mr-1 h-4 w-4" />নতুন বই
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing.id ? "এডিট" : "নতুন"} বই</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <div>
                <Label>বইয়ের নাম</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>লেখক</Label>
                <Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>দাম</Label>
              <Input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            </div>
            <div>
              <Label>আগের দাম (ঐচ্ছিক)</Label>
              <Input type="number" value={editing.original_price ?? ""} onChange={(e) => setEditing({ ...editing, original_price: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <Label>কভার ছবি আপলোড করুন</Label>
              <div className="mt-2 flex flex-col gap-3">
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  কভার ইমেজ আপলোড করুন বা URL দিন
                </div>
                {editing.cover_url && (
                  <Image src={editing.cover_url} alt="" width={240} height={320} className="h-48 w-36 rounded-lg object-cover" />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>অথবা ছবির URL</Label>
              <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <Label>সংক্ষিপ্ত বর্ণনা</Label>
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            </div>
            <div className="md:col-span-2">
              <Label>বইয়ের বিস্তারিত</Label>
              <Textarea value={editing.details ?? ""} onChange={(e) => setEditing({ ...editing, details: e.target.value })} rows={6} />
            </div>

            <div>
              <Label>রেটিং</Label>
              <Input type="number" min={0} max={5} value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} />
            </div>
            <div>
              <Label>সাজানোর ক্রম</Label>
              <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
              <Label>পাবলিশড</Label>
            </div>

            <div className="flex gap-2 md:col-span-2">
              <Button onClick={save}>সেভ করুন</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((book) => (
          <Card key={book.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {book.cover_url ? (
                <Image src={book.cover_url} alt="" width={80} height={112} className="h-20 w-14 rounded object-cover" />
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">কভার</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author || "—"}</p>
                <p className="text-xs text-muted-foreground">৳{Number(book.price).toLocaleString("bn-BD")} · {book.is_published ? "✅ পাবলিশড" : "🔒 ড্রাফট"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(book)}><Edit className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => del(book.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground">কোনো বই নেই।</p>}
      </div>
    </div>
  );
}
