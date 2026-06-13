"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toBn } from "@/lib/utils";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data ?? []);

    // Count courses per category
    const { data: courses } = await supabase
      .from("courses")
      .select("category_id")
      .eq("is_published", true);
    const counts: Record<string, number> = {};
    (courses ?? []).forEach((c: any) => {
      if (c.category_id) counts[c.category_id] = (counts[c.category_id] || 0) + 1;
    });
    setCourseCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const slugify = (name: string) =>
    name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0980-\u09FF-]/g, "");

  const addCategory = async () => {
    if (!newName.trim()) { toast.error("ক্যাটেগরির নাম দিন"); return; }
    const { error } = await supabase.from("categories").insert({
      name: newName.trim(),
      slug: slugify(newName.trim()),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("ক্যাটেগরি যোগ হয়েছে");
    setNewName("");
    load();
  };

  const updateCategory = async (id: string) => {
    if (!editName.trim()) { toast.error("ক্যাটেগরির নাম দিন"); return; }
    const { error } = await supabase.from("categories").update({
      name: editName.trim(),
      slug: slugify(editName.trim()),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("আপডেট হয়েছে");
    setEditingId(null);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (courseCounts[id] > 0) {
      toast.error(`এই ক্যাটেগরিতে ${toBn(courseCounts[id])}টি কোর্স আছে। আগে কোর্সগুলো সরান।`);
      return;
    }
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ক্যাটেগরি ম্যানেজমেন্ট</h1>
        <p className="text-sm text-muted-foreground">কোর্সের ক্যাটেগরি যোগ, এডিট ও ডিলিট করুন</p>
      </div>

      {/* Add new */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Label className="text-sm font-semibold">নতুন ক্যাটেগরি যোগ করুন</Label>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="যেমন: আর্কিটেকচার ডিজাইন"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              className="flex-1"
            />
            <Button onClick={addCategory} className="shrink-0">
              <Plus className="mr-1 h-4 w-4" />যোগ করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center gap-3 p-3">
                {editingId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => e.key === "Enter" && updateCategory(cat.id)}
                    />
                    <Button size="sm" onClick={() => updateCategory(cat.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{cat.slug} · {toBn(courseCounts[cat.id] || 0)} টি কোর্স</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">কোনো ক্যাটেগরি নেই। উপরে যোগ করুন।</p>
          )}
        </div>
      )}
    </div>
  );
}
