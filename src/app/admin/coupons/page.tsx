"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.code?.trim()) { toast.error("কুপন কোড দিন"); return; }
    if (!editing?.discount_value || Number(editing.discount_value) <= 0) { toast.error("ডিসকাউন্ট মান দিন"); return; }

    const payload = {
      code: editing.code.trim().toUpperCase(),
      discount_type: editing.discount_type || "fixed",
      discount_value: Number(editing.discount_value),
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      expires_at: editing.expires_at || null,
      is_active: editing.is_active ?? true,
    };

    const { error } = editing.id
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert({ ...payload, used_count: 0 });

    if (error) { toast.error(error.message); return; }
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">কুপন ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">প্রোমো কোড যোগ/এডিট করুন</p>
        </div>
        <Button onClick={() => setEditing({ is_active: true, discount_type: "fixed", discount_value: "", code: "", max_uses: "", expires_at: "" })}>
          <Plus className="mr-1 h-4 w-4" />নতুন কুপন
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing.id ? "এডিট" : "নতুন"} কুপন</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>কুপন কোড *</Label>
                <Input
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="যেমন: SAVE20"
                />
              </div>
              <div>
                <Label>ডিসকাউন্ট টাইপ</Label>
                <select
                  value={editing.discount_type || "fixed"}
                  onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="fixed">নির্দিষ্ট পরিমাণ (৳)</option>
                  <option value="percent">শতাংশ (%)</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>ডিসকাউন্ট মান *</Label>
                <Input
                  type="number"
                  value={editing.discount_value ?? ""}
                  onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })}
                  placeholder={editing.discount_type === "percent" ? "যেমন: 20" : "যেমন: 500"}
                />
              </div>
              <div>
                <Label>সর্বোচ্চ ব্যবহার (ঐচ্ছিক)</Label>
                <Input
                  type="number"
                  value={editing.max_uses ?? ""}
                  onChange={(e) => setEditing({ ...editing, max_uses: e.target.value })}
                  placeholder="খালি = সীমাহীন"
                />
              </div>
              <div>
                <Label>মেয়াদ শেষ (ঐচ্ছিক)</Label>
                <Input
                  type="datetime-local"
                  value={editing.expires_at ?? ""}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              <Label>অ্যাক্টিভ</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save}>সেভ করুন</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {coupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-lg">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ছাড়`}
                  {c.max_uses ? ` · সীমা: ${c.used_count || 0}/${c.max_uses}` : ` · ব্যবহার: ${c.used_count || 0}`}
                  {c.expires_at && ` · মেয়াদ: ${new Date(c.expires_at).toLocaleDateString("bn-BD")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {c.is_active ? (
                  <Badge className="bg-green-100 text-green-700">✅ অ্যাক্টিভ</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">🔒 নিষ্ক্রিয়</Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditing(c)}><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && <p className="py-10 text-center text-muted-foreground">কোনো কুপন যোগ করা হয়নি।</p>}
      </div>
    </div>
  );
}
