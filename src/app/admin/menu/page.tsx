"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminMenu() {
  const [items, setItems] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const load = async () => {
    const { data } = await supabase.from("menu_items").select("*").order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!label || !url) return;
    await supabase.from("menu_items").insert({ label, url, sort_order: items.length });
    setLabel(""); setUrl(""); load();
  };

  const remove = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    load();
  };

  const toggle = async (id: string, v: boolean) => {
    await supabase.from("menu_items").update({ is_active: v }).eq("id", id);
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    await Promise.all([
      supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">মেনু ম্যানেজমেন্ট</h1>
      <Card className="mb-4">
        <CardContent className="flex gap-2 p-4">
          <Input placeholder="লেবেল (যেমন: যোগাযোগ)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input placeholder="URL (যেমন: /contact)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />যোগ</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.is_active} onCheckedChange={(v) => toggle(item.id, v)} />
                <Button size="sm" variant="ghost" onClick={() => move(idx, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(idx, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground">কোনো মেনু নেই</p>}
      </div>
    </div>
  );
}
