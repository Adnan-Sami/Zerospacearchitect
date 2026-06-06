"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleBan = async (s: any) => {
    const next = !s.is_banned;
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: next })
      .eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "ব্যান করা হয়েছে" : "আনব্যান করা হয়েছে");
      load();
    }
  };

  const filtered = students.filter(
    (s) =>
      !search ||
      (s.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search)
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        শিক্ষার্থী তালিকা ({students.length})
      </h1>
      <Input
        placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-md"
      />
      <div className="space-y-2">
        {filtered.map((s) => (
          <Card
            key={s.id}
            className={
              s.is_banned ? "border-destructive/40 bg-destructive/5" : ""
            }
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-medium">
                    {s.full_name || "নাম নেই"}{" "}
                    {s.is_banned && (
                      <Badge variant="destructive" className="ml-2">
                        ব্যানড
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {s.phone || "ফোন নেই"} · যোগদান:{" "}
                    {new Date(s.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={s.is_banned ? "outline" : "destructive"}
                onClick={() => toggleBan(s)}
              >
                {s.is_banned ? (
                  <>
                    <CheckCircle className="mr-1 h-4 w-4" />আনব্যান
                  </>
                ) : (
                  <>
                    <Ban className="mr-1 h-4 w-4" />ব্যান
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground">কোনো শিক্ষার্থী নেই।</p>
        )}
      </div>
    </div>
  );
}
