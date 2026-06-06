"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminBanners() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase
      .from("promo_banners")
      .select("*")
      .order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing.image_url) {
      toast.error("ছবির URL দিন");
      return;
    }
    const payload = {
      title: editing.title ?? "",
      subtitle: editing.subtitle ?? "",
      image_url: editing.image_url,
      link_url: editing.link_url ?? "",
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase
          .from("promo_banners")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("promo_banners").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("promo_banners").delete().eq("id", id);
    load();
  };

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("course-thumbnails")
      .upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">প্রোমো ব্যানার</h1>
        <Button
          onClick={() => setEditing({ is_active: true, sort_order: 0 })}
        >
          <Plus className="mr-1 h-4 w-4" />নতুন ব্যানার
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing.id ? "এডিট" : "নতুন"} ব্যানার</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>শিরোনাম (ঐচ্ছিক)</Label>
              <Input
                value={editing.title ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>ব্যানার ছবি আপলোড করুন</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && upload(e.target.files[0])
                }
              />
              {editing.image_url && (
                <Image
                  src={editing.image_url}
                  alt=""
                  width={200}
                  height={96}
                  className="mt-2 h-24 rounded object-cover"
                />
              )}
            </div>
            <div>
              <Label>অথবা ছবির URL</Label>
              <Input
                value={editing.image_url ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, image_url: e.target.value })
                }
              />
            </div>
            <div>
              <Label>লিংক URL</Label>
              <Input
                value={editing.link_url ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, link_url: e.target.value })
                }
                placeholder="/courses"
              />
            </div>
            <div>
              <Label>সাজানোর ক্রম</Label>
              <Input
                type="number"
                value={editing.sort_order ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, sort_order: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing.is_active ?? true}
                onCheckedChange={(v) =>
                  setEditing({ ...editing, is_active: v })
                }
              />
              <Label>অ্যাক্টিভ</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>সেভ করুন</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                বাতিল
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Image
                src={s.image_url}
                alt=""
                width={112}
                height={64}
                className="h-16 w-28 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold">{s.title || "—"}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(s)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => del(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground">কোনো ব্যানার নেই।</p>
        )}
      </div>
    </div>
  );
}
