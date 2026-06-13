"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X, Send, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";

const CATEGORY_LABELS: Record<string, string> = {
  general: "সাধারণ",
  payment: "পেমেন্ট",
  course: "কোর্স",
  technical: "টেকনিক্যাল",
  other: "অন্যান্য",
};
const STATUS_LABELS: Record<string, string> = {
  open: "খোলা",
  in_progress: "প্রক্রিয়াধীন",
  resolved: "সমাধান হয়েছে",
  closed: "বন্ধ",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "এইমাত্র";
  if (min < 60) return `${min} মিনিট আগে`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ঘণ্টা আগে`;
  return `${Math.floor(hr / 24)} দিন আগে`;
}

async function apiCall(action: string, payload: Record<string, unknown>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch("/api/support", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
}

export default function InstructorSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, any[]>>({});
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<Record<string, HTMLInputElement | null>>({});
  const bottomRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadReplies = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("support_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setRepliesMap((prev) => ({ ...prev, [ticketId]: data ?? [] }));
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    await loadReplies(id);
    setTimeout(
      () =>
        bottomRefs.current[id]?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        }),
      150
    );
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await apiCall("create-ticket", {
        subject,
        category,
        message,
        userRole: "instructor",
      });
      toast.success("টিকেট তৈরি হয়েছে");
      setShowForm(false);
      setSubject("");
      setCategory("general");
      setMessage("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (ticketId: string, status: string) => {
    if (!replyText.trim() && !replyImage || status === "closed") return;
    setSendingReply(true);
    try {
      let imageUrl = "";
      if (replyImage) {
        imageUrl = replyImage;
      }
      await apiCall("add-reply", { ticketId, message: replyText, imageUrl });
      setReplyText("");
      setReplyImage(null);
      await loadReplies(ticketId);
      setTimeout(
        () =>
          bottomRefs.current[ticketId]?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        100
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleImageUpload = async (ticketId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ছবির সাইজ ৫MB এর কম হতে হবে");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি আপলোড করা যাবে");
      return;
    }
    setUploadingImage(true);
    try {
      const publicUrl = await uploadFile(file, { folder: "support-images", bucket: "avatars" });
      setReplyImage(publicUrl);
      toast.success("ছবি আপলোড হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">সাপোর্ট টিকেট</h1>
          <p className="text-sm text-muted-foreground">
            আপনার সমস্যা সাবমিট করুন, আমরা দ্রুত সাহায্য করব
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-1 h-4 w-4" />
            নতুন টিকেট
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">নতুন টিকেট তৈরি করুন</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={createTicket} className="space-y-3">
              <div>
                <Label>বিষয় *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="সমস্যার বিষয় লিখুন"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ক্যাটেগরি</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>বার্তা *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="সমস্যার বিস্তারিত বিবরণ লিখুন..."
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "সাবমিট হচ্ছে..." : "সাবমিট করুন"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  বাতিল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ticket list */}
      {loading ? (
        <p className="text-center text-muted-foreground py-10">লোড হচ্ছে...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed py-16 text-center">
          <p className="text-muted-foreground">কোনো সাপোর্ট টিকেট নেই</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowForm(true)}
          >
            প্রথম টিকেট তৈরি করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Ticket header */}
                <button
                  className="w-full p-4 text-left flex flex-col gap-2 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(t.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug">
                      {t.subject}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        className={`text-[10px] ${STATUS_COLORS[t.status]}`}
                      >
                        {STATUS_LABELS[t.status]}
                      </Badge>
                      {expandedId === t.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {CATEGORY_LABELS[t.category]}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {timeAgo(t.updated_at)}
                    </span>
                  </div>
                </button>

                {/* Expanded: reply thread */}
                {expandedId === t.id && (
                  <div className="border-t">
                    {/* Messages */}
                    <div className="max-h-80 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                      {(repliesMap[t.id] ?? []).map((r: any) => {
                        const isAdminReply = r.sender_role === "admin";
                        return (
                          <div
                            key={r.id}
                            className={`flex ${isAdminReply ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                isAdminReply
                                  ? "bg-white border text-gray-900 rounded-tl-sm shadow-sm"
                                  : "bg-purple-500 text-white rounded-tr-sm"
                              }`}
                            >
                              <p
                                className={`text-[10px] font-semibold mb-1 ${isAdminReply ? "text-gray-400" : "text-purple-100"}`}
                              >
                                {isAdminReply ? "সাপোর্ট টিম" : "আপনি"}
                              </p>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {r.message}
                              </p>
                              {r.image_url && (
                                <img 
                                  src={r.image_url} 
                                  alt="Attachment" 
                                  className="mt-2 rounded-lg max-w-full h-auto max-h-64 object-contain"
                                />
                              )}
                              <p
                                className={`text-[10px] mt-1 ${isAdminReply ? "text-gray-400" : "text-purple-200"}`}
                              >
                                {timeAgo(r.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div
                        ref={(el) => {
                          bottomRefs.current[t.id] = el;
                        }}
                      />
                    </div>
                    {/* Reply input */}
                    {t.status !== "closed" ? (
                      <div className="p-3 flex flex-col gap-2 border-t bg-white">
                        {replyImage && expandedId === t.id && (
                          <div className="relative inline-block">
                            <img 
                              src={replyImage} 
                              alt="Preview" 
                              className="h-20 w-20 object-cover rounded-lg border"
                            />
                            <button
                              onClick={() => setReplyImage(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            ref={(el) => {
                              fileInputRef.current[t.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(t.id, e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current[t.id]?.click()}
                            disabled={uploadingImage}
                            className="h-9 w-9 shrink-0"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                          <Textarea
                            value={expandedId === t.id ? replyText : ""}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="রিপ্লাই লিখুন..."
                            rows={2}
                            className="flex-1 resize-none text-sm"
                          />
                          <Button
                            size="sm"
                            className="self-end h-9 bg-purple-600 hover:bg-purple-700"
                            disabled={sendingReply || (!replyText.trim() && !replyImage)}
                            onClick={() => sendReply(t.id, t.status)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-t bg-gray-50 text-center text-xs text-muted-foreground">
                        এই টিকেট বন্ধ হয়েছে
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
