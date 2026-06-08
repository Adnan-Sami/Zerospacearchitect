"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Save, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InstructorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    designation: "",
    bio: "",
    image_url: "",
    facebook_url: "",
    youtube_url: "",
    phone: "",
    email: "",
  });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);

      // Load existing profile
      const { data } = await supabase
        .from("instructor_profile_details")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        setForm({
          name: data.name || "",
          title: data.title || "",
          designation: data.designation || "",
          bio: data.bio || "",
          image_url: data.image_url || "",
          facebook_url: data.facebook_url || "",
          youtube_url: data.youtube_url || "",
          phone: data.phone || "",
          email: data.email || "",
        });
      } else {
        // Pre-fill from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", session.user.id)
          .single();
        if (profile) {
          setForm((prev) => ({
            ...prev,
            name: profile.full_name || "",
            phone: profile.phone || "",
            email: "",
          }));
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    if (!form.name.trim()) { toast.error("নাম অবশ্যই দিতে হবে"); return; }
    if (!form.title.trim()) { toast.error("পদবী / টাইটেল দিতে হবে"); return; }
    if (!form.designation.trim()) { toast.error("ডেজিগনেশন / প্রতিষ্ঠান দিতে হবে"); return; }
    if (!form.bio.trim()) { toast.error("বায়ো / পরিচিতি দিতে হবে"); return; }
    if (!form.phone.trim()) { toast.error("ফোন নম্বর দিতে হবে"); return; }
    if (!form.email.trim()) { toast.error("ইমেইল দিতে হবে"); return; }
    if (!form.facebook_url.trim()) { toast.error("Facebook URL দিতে হবে"); return; }

    setSaving(true);
    const payload = {
      user_id: userId,
      name: form.name.trim(),
      title: form.title.trim(),
      designation: form.designation.trim(),
      bio: form.bio.trim(),
      image_url: form.image_url.trim(),
      facebook_url: form.facebook_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim(),
    };

    let error;
    const isNewSubmission = !existingId;
    if (existingId) {
      ({ error } = await supabase
        .from("instructor_profile_details")
        .update({ ...payload, is_seen: false, is_approved: false })
        .eq("id", existingId));
    } else {
      const { data, error: insertError } = await supabase
        .from("instructor_profile_details")
        .insert({ ...payload, is_seen: false, is_approved: false })
        .select("id")
        .single();
      error = insertError;
      if (data) setExistingId(data.id);
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("প্রোফাইল সেভ হয়েছে!");
      setSaved(true);
      // Notify admins about new/updated profile submission
      await fetch("/api/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: isNewSubmission ? "নতুন ইন্সট্রাক্টর প্রোফাইল সাবমিট" : "ইন্সট্রাক্টর প্রোফাইল আপডেট",
          message: `${form.name.trim()} তার প্রোফাইল ${isNewSubmission ? "সাবমিট" : "আপডেট"} করেছেন।`,
          type: "instructor_profile",
          link: "/admin/instructor-profiles",
        }),
      });
    }
    setSaving(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `instructor-profiles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">আমার প্রোফাইল</h1>
        <p className="text-sm text-muted-foreground">
          আপনার প্রোফাইল তথ্য দিন — এটি অ্যাডমিন রিভিউ করবেন এবং পাবলিক পেজে প্রকাশ করতে পারবেন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />প্রোফাইল তথ্য
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>পূর্ণ নাম *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: Professor Dr. Jahangir Alam"
              />
            </div>
            <div>
              <Label>পদবী / টাইটেল *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: Founder of Qlearn"
              />
            </div>
          </div>

          <div>
            <Label>ডেজিগনেশন / প্রতিষ্ঠান *</Label>
            <Input
              required
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              placeholder="যেমন: Professor of Civil Engineering, BUET, Dhaka"
            />
          </div>

          <div>
            <Label>বায়ো / পরিচিতি *</Label>
            <Textarea
              required
              rows={5}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="আপনার শিক্ষাগত যোগ্যতা, অভিজ্ঞতা, এবং পেশাদার পরিচিতি লিখুন..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>ফোন নম্বর *</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="০১XXXXXXXXX"
              />
            </div>
            <div>
              <Label>ইমেইল *</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Facebook URL *</Label>
              <Input
                required
                value={form.facebook_url}
                onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <Label>YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
          </div>

          <div>
            <Label>প্রোফাইল ছবি</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
            {uploading && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />আপলোড হচ্ছে...
              </p>
            )}
            {form.image_url && (
              <Image
                src={form.image_url}
                alt="Profile"
                width={100}
                height={100}
                className="mt-3 h-24 w-24 rounded-full object-cover shadow-md"
              />
            )}
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving} className={saved ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "প্রোফাইল সেভ করুন"}
            </Button>
            {saved && (
              <p className="mt-2 text-sm text-green-600">
                ✅ আপনার প্রোফাইল সফলভাবে সাবমিট হয়েছে। অ্যাডমিন রিভিউ করে পাবলিশ করবেন।
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
