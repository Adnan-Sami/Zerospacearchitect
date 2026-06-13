"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    setSettings(data);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaved(false);

    const payload: Record<string, any> = {
      site_name: settings.site_name?.trim() || "ZeroSpace Architect",
      commission_percentage: Math.max(1, Math.min(99, Number(settings.commission_percentage) || 40)),
      bkash_number: settings.bkash_number?.trim() ?? "",
      nagad_number: settings.nagad_number?.trim() ?? "",
      rocket_number: settings.rocket_number?.trim() ?? "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", settings.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("সেভ হয়েছে!");
    setSaved(true);
  };

  if (!settings)
    return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">সাইট সেটিংস</h1>
      <Card>
        <CardHeader>
          <CardTitle>সাইট কনফিগারেশন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>সাইটের নাম</Label>
            <Input
              value={settings.site_name ?? ""}
              onChange={(e) => { setSettings({ ...settings, site_name: e.target.value }); setSaved(false); }}
            />
          </div>
          <div>
            <Label>ইন্সট্রাক্টর কমিশন (%)</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={settings.commission_percentage ?? 40}
              onChange={(e) => { setSettings({ ...settings, commission_percentage: e.target.value }); setSaved(false); }}
            />
            <p className="mt-1 text-xs text-muted-foreground">ইন্সট্রাক্টরদের কমিশন শতাংশ (১-৯৯)। ডিফল্ট: ৪০%</p>
          </div>
          <div>
            <Label>বিকাশ পার্সোনাল নম্বর</Label>
            <Input
              value={settings.bkash_number ?? ""}
              onChange={(e) => { setSettings({ ...settings, bkash_number: e.target.value }); setSaved(false); }}
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <div>
            <Label>নগদ পার্সোনাল নম্বর</Label>
            <Input
              value={settings.nagad_number ?? ""}
              onChange={(e) => { setSettings({ ...settings, nagad_number: e.target.value }); setSaved(false); }}
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <div>
            <Label>রকেট পার্সোনাল নম্বর</Label>
            <Input
              value={settings.rocket_number ?? ""}
              onChange={(e) => { setSettings({ ...settings, rocket_number: e.target.value }); setSaved(false); }}
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
              {saved ? <CheckCircle className="mr-1 h-4 w-4" /> : <Save className="mr-1 h-4 w-4" />}
              {saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
            </Button>
            {saved && <p className="text-sm text-green-600">✅ সফলভাবে সেভ হয়েছে</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
