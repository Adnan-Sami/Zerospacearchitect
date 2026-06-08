"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, Facebook, Youtube, X, Phone, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type InstructorProfile = {
  id: string;
  user_id: string;
  name: string;
  title: string;
  designation: string;
  bio: string;
  image_url: string;
  facebook_url: string | null;
  youtube_url: string | null;
  phone: string;
  email: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminInstructorProfiles() {
  const [profiles, setProfiles] = useState<InstructorProfile[]>([]);
  const [selected, setSelected] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("instructor_profile_details")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles((data as InstructorProfile[]) ?? []);
    setLoading(false);

    // Mark all as seen when admin visits this page
    if (data && data.length > 0) {
      const unseenIds = data.filter((p: any) => !p.is_seen).map((p: any) => p.id);
      if (unseenIds.length > 0) {
        await supabase
          .from("instructor_profile_details")
          .update({ is_seen: true })
          .in("id", unseenIds);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveProfile = async (profile: InstructorProfile) => {
    setApproving(true);

    // Check if this instructor already has a published profile (re-approval case)
    const { data: existing } = await supabase
      .from("public_instructors")
      .select("id")
      .eq("name", profile.name)
      .maybeSingle();

    if (existing) {
      // Update the existing published profile with new data
      const { error } = await supabase
        .from("public_instructors")
        .update({
          name: profile.name,
          title: profile.title || "",
          designation: profile.designation || "",
          bio: profile.bio || "",
          image_url: profile.image_url || "",
          facebook_url: profile.facebook_url || null,
          youtube_url: profile.youtube_url || null,
        })
        .eq("id", existing.id);

      if (error) {
        toast.error("আপডেট করতে সমস্যা: " + error.message);
        setApproving(false);
        return;
      }
    } else {
      // Insert new entry into public_instructors
      const { error } = await supabase.from("public_instructors").insert({
        name: profile.name,
        title: profile.title || "",
        designation: profile.designation || "",
        bio: profile.bio || "",
        image_url: profile.image_url || "",
        facebook_url: profile.facebook_url || null,
        youtube_url: profile.youtube_url || null,
        total_courses: 0,
        total_students: 0,
        sort_order: 0,
        is_active: true,
      });

      if (error) {
        toast.error("অ্যাপ্রুভ করতে সমস্যা: " + error.message);
        setApproving(false);
        return;
      }
    }

    // Mark the submission as approved
    await supabase
      .from("instructor_profile_details")
      .update({ is_approved: true })
      .eq("id", profile.id);

    toast.success(
      existing
        ? `${profile.name} এর আপডেট অ্যাপ্রুভ হয়েছে এবং পাবলিক প্রোফাইলে সিঙ্ক হয়েছে!`
        : `${profile.name} অ্যাপ্রুভ হয়েছে এবং "প্রশিক্ষক প্রোফাইল" পেজে পাবলিশ হয়েছে!`
    );
    setApproving(false);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ইন্সট্রাক্টর প্রোফাইল সাবমিশন</h1>
        <p className="text-sm text-muted-foreground">
          ইন্সট্রাক্টরদের জমা দেওয়া প্রোফাইল দেখুন। &quot;অ্যাপ্রুভ&quot; করলে স্বয়ংক্রিয়ভাবে &quot;প্রশিক্ষক প্রোফাইল&quot; পেজে পাবলিশ হবে।
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : profiles.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">কোনো ইন্সট্রাক্টর এখনো প্রোফাইল সাবমিট করেনি।</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelected(profile)}>
              <CardContent className="flex items-center gap-4 p-4">
                {profile.image_url ? (
                  <Image src={profile.image_url} alt={profile.name} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                    {profile.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.title || profile.designation || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    জমা: {new Date(profile.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {profile.is_approved ? (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">✅ অ্যাপ্রুভড</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">⏳ অ্যাপ্রুভ বাকি</Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(profile); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">ইন্সট্রাক্টর প্রোফাইল</CardTitle>
                <button className="rounded-full p-1 hover:bg-gray-200" onClick={() => setSelected(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                {selected.image_url ? (
                  <Image src={selected.image_url} alt={selected.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover shadow-md" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-700">
                    {selected.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selected.name}</h3>
                  {selected.title && <p className="text-sm text-muted-foreground">{selected.title}</p>}
                  {selected.designation && <p className="text-xs text-muted-foreground">{selected.designation}</p>}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                {selected.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selected.phone}</span>
                  </div>
                )}
                {selected.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selected.email}</span>
                  </div>
                )}
                {selected.facebook_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <a href={selected.facebook_url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">
                      {selected.facebook_url}
                    </a>
                  </div>
                )}
                {selected.youtube_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Youtube className="h-4 w-4 text-red-600" />
                    <a href={selected.youtube_url} target="_blank" rel="noopener noreferrer" className="truncate text-red-600 hover:underline">
                      {selected.youtube_url}
                    </a>
                  </div>
                )}
              </div>

              {/* Bio */}
              {selected.bio && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">বায়ো / পরিচিতি:</p>
                  <p className="whitespace-pre-line text-sm">{selected.bio}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {!selected.is_approved ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={approving}
                    onClick={() => approveProfile(selected)}
                  >
                    {approving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {approving ? "অ্যাপ্রুভ হচ্ছে..." : "অ্যাপ্রুভ ও পাবলিশ করুন"}
                  </Button>
                ) : (
                  <Badge className="bg-green-100 px-4 py-2 text-green-700">✅ অ্যাপ্রুভড — পাবলিক পেজে লাইভ আছে</Badge>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>বন্ধ করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
