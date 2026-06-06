"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Camera, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name);
            setPhone(data.phone ?? "");
            setAvatarUrl(data.avatar_url ?? "");
          }
        });
    });
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ছবির সাইজ ৫MB এর কম হতে হবে");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", userId);
    if (dbErr) toast.error(dbErr.message);
    else {
      setAvatarUrl(publicUrl);
      toast.success("প্রোফাইল ছবি আপডেট হয়েছে!");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("user_id", user.id);
      if (error) setMessage("ত্রুটি: " + error.message);
      else setMessage("প্রোফাইল আপডেট হয়েছে!");
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    setPwdMessage("");
    setPwdError("");
    if (newPassword.length < 6) {
      setPwdError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("পাসওয়ার্ড মিলছে না");
      return;
    }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwdError("ত্রুটি: " + error.message);
    else {
      setPwdMessage("পাসওয়ার্ড পরিবর্তন হয়েছে!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPwdSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">প্রোফাইল সেটিংস</h1>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <LayoutDashboard className="mr-1 h-4 w-4" />ড্যাশবোর্ড
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ব্যক্তিগত তথ্য</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <p className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {message}
                </p>
              )}
              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback>
                      <UserIcon className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
                    aria-label="প্রোফাইল ছবি পরিবর্তন"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {uploading
                    ? "আপলোড হচ্ছে..."
                    : "ছবি পরিবর্তনের জন্য ক্যামেরা আইকনে ক্লিক করুন"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>পুরো নাম</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ফোন নম্বর</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>পাসওয়ার্ড পরিবর্তন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pwdMessage && (
                <p className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {pwdMessage}
                </p>
              )}
              {pwdError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {pwdError}
                </p>
              )}
              <div className="space-y-2">
                <Label>নতুন পাসওয়ার্ড</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                />
              </div>
              <div className="space-y-2">
                <Label>নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={pwdSaving || !newPassword}
              >
                {pwdSaving ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
