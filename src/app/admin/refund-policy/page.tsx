"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Eye, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";import Link from "next/link";

export default function AdminRefundPolicy() {
  const [title, setTitle] = useState("রিফান্ড নীতিমালা");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlign, setImageAlign] = useState<"full" | "center" | "left" | "right">("full");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: titleData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_title")
        .maybeSingle();
      if (titleData?.value) setTitle(titleData.value);

      const { data: contentData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_content")
        .maybeSingle();
      if (contentData?.value) setContent(contentData.value);
      
      const { data: imageData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_image")
        .maybeSingle();
      if (imageData?.value) setImageUrl(imageData.value);

      const { data: alignData } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "refund_policy_image_align")
        .maybeSingle();
      if (alignData?.value) setImageAlign(alignData.value as any);
      
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // Upsert title
    const { data: existingTitle } = await supabase
      .from("site_content")
      .select("key")
      .eq("key", "refund_policy_title")
      .maybeSingle();

    if (existingTitle) {
      await supabase.from("site_content").update({ value: title }).eq("key", "refund_policy_title");
    } else {
      await supabase.from("site_content").insert({ key: "refund_policy_title", value: title, description: "রিফান্ড পলিসি পেজের শিরোনাম" });
    }

    // Upsert content
    const { data: existingContent } = await supabase
      .from("site_content")
      .select("key")
      .eq("key", "refund_policy_content")
      .maybeSingle();

    if (existingContent) {
      await supabase.from("site_content").update({ value: content }).eq("key", "refund_policy_content");
    } else {
      await supabase.from("site_content").insert({ key: "refund_policy_content", value: content, description: "রিফান্ড পলিসি পেজের কন্টেন্ট" });
    }

    // Upsert image
    const { data: existingImage } = await supabase
      .from("site_content")
      .select("key")
      .eq("key", "refund_policy_image")
      .maybeSingle();

    if (existingImage) {
      await supabase.from("site_content").update({ value: imageUrl }).eq("key", "refund_policy_image");
    } else if (imageUrl) {
      await supabase.from("site_content").insert({ key: "refund_policy_image", value: imageUrl, description: "রিফান্ড পলিসি পেজের ছবি" });
    }

    // Upsert image alignment
    await supabase.from("site_content").upsert({ key: "refund_policy_image_align", value: imageAlign, description: "রিফান্ড পলিসি ছবির অ্যালাইনমেন্ট" }, { onConflict: "key" });

    toast.success("রিফান্ড পলিসি সেভ হয়েছে!");
    setSaving(false);
    setSaved(true);
  };

  // Formatting helpers
  const insertFormat = (before: string, after: string) => {
    const el = document.getElementById("refund-content-editor") as HTMLTextAreaElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setSaved(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const el = document.getElementById("refund-content-editor") as HTMLTextAreaElement;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newContent);
    setSaved(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + prefix.length, start + prefix.length); }, 0);
  };

  const insertNumberedList = () => {
    const el = document.getElementById("refund-content-editor") as HTMLTextAreaElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    if (selected) {
      const lines = selected.split("\n");
      const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
      const newContent = content.slice(0, start) + numbered + content.slice(end);
      setContent(newContent);
    } else {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const newContent = content.slice(0, lineStart) + "1. " + content.slice(lineStart);
      setContent(newContent);
    }
    setSaved(false);
    setTimeout(() => el.focus(), 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">রিফান্ড পলিসি এডিটর</h1>
          <p className="text-sm text-muted-foreground">যা লিখবেন বা পেস্ট করবেন, ঠিক তেমনই পাবলিক পেজে দেখাবে</p>
        </div>
        <Link href="/refund-policy" target="_blank">
          <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" />পেজ দেখুন</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">পেজ কন্টেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>পেজ শিরোনাম</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
              placeholder="রিফান্ড নীতিমালা"
            />
          </div>

          <div>
            <Label>কন্টেন্ট</Label>
            {/* Formatting Toolbar */}
            <div className="mt-1.5 mb-1 flex flex-wrap gap-1 rounded-t-md border border-b-0 bg-muted/30 px-2 py-1.5">
              <button type="button" className="rounded px-2 py-1 text-xs font-bold hover:bg-white hover:shadow-sm" title="Bold" onClick={() => insertFormat("**", "**")}>B</button>
              <button type="button" className="rounded px-2 py-1 text-xs italic hover:bg-white hover:shadow-sm" title="Italic" onClick={() => insertFormat("*", "*")}>I</button>
              <button type="button" className="rounded px-2 py-1 text-xs underline hover:bg-white hover:shadow-sm" title="Underline" onClick={() => insertFormat("__", "__")}>U</button>
              <div className="mx-1 w-px bg-border" />
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-white hover:shadow-sm" title="Bullet Point" onClick={() => insertLinePrefix("• ")}>• তালিকা</button>
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-white hover:shadow-sm" title="Numbered List" onClick={() => insertNumberedList()}>1. নম্বর</button>
              <div className="mx-1 w-px bg-border" />
              <button type="button" className="rounded px-2 py-1 text-xs font-bold hover:bg-white hover:shadow-sm" title="Heading" onClick={() => insertLinePrefix("## ")}>H শিরোনাম</button>
            </div>
            <Textarea
              id="refund-content-editor"
              rows={18}
              value={content}
              onChange={(e) => { setContent(e.target.value); setSaved(false); }}
              placeholder="এখানে আপনার রিফান্ড পলিসি লিখুন বা পেস্ট করুন..."
              className="rounded-t-none text-sm leading-relaxed"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              **বোল্ড**, *ইটালিক*, __আন্ডারলাইন__, • বুলেট পয়েন্ট, ## শিরোনাম
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label>ছবি (ঐচ্ছিক — পলিসির সাথে ছবি দেখাতে চাইলে আপলোড করুন)</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadFile(file, { folder: "refund-policy" });
                  setImageUrl(url);
                  setSaved(false);
                } catch (err: any) {
                  toast.error(err.message || "আপলোড ব্যর্থ");
                }
                setUploading(false);
              }}
            />
            {uploading && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />আপলোড হচ্ছে...</p>}
            {imageUrl && (
              <div className="mt-2 flex items-start gap-3">
                <img src={imageUrl} alt="" className="h-24 rounded-lg object-cover shadow-sm" />
                <Button variant="outline" size="sm" onClick={() => { setImageUrl(""); setSaved(false); }}>সরান</Button>
              </div>
            )}
            {imageUrl && (
              <div className="mt-3">
                <Label className="text-xs">ছবির অ্যালাইনমেন্ট</Label>
                <div className="mt-1.5 flex gap-2">
                  {([
                    { v: "full" as const, l: "পূর্ণ প্রস্থ" },
                    { v: "center" as const, l: "মাঝখানে" },
                    { v: "left" as const, l: "বামে" },
                    { v: "right" as const, l: "ডানে" },
                  ]).map((opt) => (
                    <Button
                      key={opt.v}
                      type="button"
                      size="sm"
                      variant={imageAlign === opt.v ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => { setImageAlign(opt.v); setSaved(false); }}
                    >
                      {opt.l}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="mr-1 h-4 w-4" />{showPreview ? "প্রিভিউ বন্ধ করুন" : "প্রিভিউ দেখুন"}
            </Button>
          </div>

          {showPreview && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-sky-700">{title}</h2>
              {imageUrl && <img src={imageUrl} alt="" className={`mb-4 rounded-lg object-cover ${imageAlign === "full" ? "w-full max-h-64" : imageAlign === "center" ? "mx-auto max-w-md max-h-64" : imageAlign === "left" ? "float-left mr-4 max-w-xs max-h-48" : "float-right ml-4 max-w-xs max-h-48"}`} />}
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {content || "কন্টেন্ট এখনো লেখা হয়নি..."}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
            </Button>
            {saved && <p className="text-sm text-green-600">✅ সফলভাবে সেভ হয়েছে</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
