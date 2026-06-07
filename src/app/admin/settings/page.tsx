"use client";

import { useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

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

  const persist = async (next: any) => {
    // Build update payload — only include payment fields if the columns exist
    const payload: Record<string, any> = {
      logo_url: next.logo_url ?? "",
      site_name: next.site_name,
      footer_text: next.footer_text ?? "",
      updated_at: new Date().toISOString(),
    };
    if (next.bkash_number !== undefined) payload.bkash_number = next.bkash_number ?? "";
    if (next.nagad_number !== undefined) payload.nagad_number = next.nagad_number ?? "";
    if (next.rocket_number !== undefined) payload.rocket_number = next.rocket_number ?? "";

    const { error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", next.id)
      .select()
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!settings) return;
    if (!settings.site_name?.trim()) {
      toast.error("সাইটের নাম খালি রাখা যাবে না");
      return;
    }
    const ok = await persist({
      ...settings,
      site_name: settings.site_name.trim(),
    });
    if (ok) toast.success("সেভ হয়েছে — পেজ রিফ্রেশ করলে পরিবর্তন দেখবেন");
  };

  const uploadLogo = async (file: File) => {
    if (!settings) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const updated = { ...settings, logo_url: data.publicUrl };
    setSettings(updated);
    const ok = await persist(updated);
    setUploading(false);
    if (ok) toast.success("লোগো আপলোড ও সেভ হয়েছে");
  };

  if (!settings)
    return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">সাইট সেটিংস</h1>
      <Card>
        <CardHeader>
          <CardTitle>সাধারণ তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>সাইটের নাম</Label>
            <Input
              value={settings.site_name}
              onChange={(e) =>
                setSettings({ ...settings, site_name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>লোগো</Label>
            {settings.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt="logo"
                className="my-2 h-16 rounded border bg-muted p-2"
              />
            )}
            <div className="flex gap-2">
              <Input
                value={settings.logo_url}
                onChange={(e) =>
                  setSettings({ ...settings, logo_url: e.target.value })
                }
                placeholder="লোগো URL"
              />
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && uploadLogo(e.target.files[0])
                  }
                />
                <Button asChild variant="outline" disabled={uploading}>
                  <span>
                    <Upload className="mr-1 h-4 w-4" />
                    {uploading ? "..." : "আপলোড"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
          <div>
            <Label>ফুটার টেক্সট</Label>
            <Textarea
              value={settings.footer_text ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, footer_text: e.target.value })
              }
            />
          </div>
          <div>
            <Label>বিকাশ নম্বর</Label>
            <Input
              value={settings.bkash_number ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, bkash_number: e.target.value })
              }
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <div>
            <Label>নগদ নম্বর</Label>
            <Input
              value={settings.nagad_number ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, nagad_number: e.target.value })
              }
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <div>
            <Label>রকেট নম্বর</Label>
            <Input
              value={settings.rocket_number ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, rocket_number: e.target.value })
              }
              placeholder="০১XXXXXXXXX"
            />
          </div>
          <Button onClick={save}>
            <Save className="mr-1 h-4 w-4" />সেভ করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
