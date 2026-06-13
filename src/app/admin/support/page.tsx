"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  ArrowLeft,
  RefreshCw,
  Clock,
  MessageSquare,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";
import { Image as ImageIcon, X } from "lucide-react";

type Ticket = {
  id: string;
  user_id: string;
  user_role: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  avatar_url?: string;
};

type Reply = {
  id: string;
  ticket_id: string;
  user_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  user_name?: string;
  avatar_url?: string;
  image_url?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "সাধারণ",
  payment: "পেমেন্ট",
  course: "কোর্স",
  technical: "টেকনিক্যাল",
  other: "অন্যান্য",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 border-slate-200",
  payment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  course: "bg-indigo-50 text-indigo-700 border-indigo-100",
  technical: "bg-rose-50 text-rose-700 border-rose-100",
  other: "bg-amber-50 text-amber-700 border-amber-100",
};

const STATUS_LABELS: Record<string, string> = {
  open: "খোলা",
  in_progress: "প্রক্রিয়াধীন",
  resolved: "সমাধান হয়েছে",
  closed: "বন্ধ",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border border-slate-200",
};

const STATUS_CHIP_ACTIVE: Record<string, string> = {
  open: "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 scale-[1.02]",
  in_progress: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200 scale-[1.02]",
  resolved: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200 scale-[1.02]",
  closed: "bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-200 scale-[1.02]",
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

function getInitials(name?: string) {
  if (!name || name === "—") return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarBg(name?: string) {
  if (!name || name === "—") return "bg-slate-200 text-slate-650";
  const colors = [
    "bg-red-50 text-red-750 border-red-150",
    "bg-orange-50 text-orange-750 border-orange-150",
    "bg-amber-50 text-amber-750 border-amber-150",
    "bg-emerald-50 text-emerald-750 border-emerald-150",
    "bg-teal-50 text-teal-750 border-teal-150",
    "bg-cyan-50 text-cyan-750 border-cyan-150",
    "bg-sky-50 text-sky-750 border-sky-150",
    "bg-indigo-50 text-indigo-750 border-indigo-150",
    "bg-purple-50 text-purple-750 border-purple-150",
    "bg-pink-50 text-pink-750 border-pink-150",
    "bg-rose-50 text-rose-750 border-rose-150",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data: ticketData } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!ticketData?.length) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(ticketData.map((t: any) => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const nameMap: Record<string, string> = {};
    const avatarMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => {
      nameMap[p.user_id] = p.full_name || "";
      avatarMap[p.user_id] = p.avatar_url || "";
    });

    setTickets(
      ticketData.map((t: any) => ({
        ...t,
        user_name: nameMap[t.user_id] || "—",
        avatar_url: avatarMap[t.user_id],
      })),
    );
    setLoading(false);
  }, []);

  const loadReplies = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("support_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (!data?.length) {
      setReplies([]);
      return;
    }
    const userIds = [...new Set(data.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);
    const nameMap: Record<string, string> = {};
    const avatarMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => {
      nameMap[p.user_id] = p.full_name || "";
      avatarMap[p.user_id] = p.avatar_url || "";
    });
    setReplies(
      data.map((r: any) => ({ 
        ...r, 
        user_name: nameMap[r.user_id] || "—",
        avatar_url: avatarMap[r.user_id],
      })),
    );
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selected) {
      loadReplies(selected.id);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [selected, loadReplies]);

  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [replies]);

  const selectTicket = (ticket: Ticket) => {
    setSelected(ticket);
    setMobileView("detail");
  };

  const sendReply = async () => {
    if (!replyText.trim() && !replyImage || !selected) return;
    setSending(true);
    try {
      let imageUrl = "";
      if (replyImage) {
        imageUrl = replyImage;
      }
      await apiCall("add-reply", { ticketId: selected.id, message: replyText, imageUrl });
      setReplyText("");
      setReplyImage(null);
      await loadReplies(selected.id);
      await loadTickets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const changeStatus = async (status: string) => {
    if (!selected) return;
    try {
      await apiCall("update-status", { ticketId: selected.id, status });
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
      setSelected((prev) => (prev ? { ...prev, status } : prev));
      await loadTickets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const TicketList = (
    <div className="flex flex-col h-full bg-slate-50/40">
      <div className="shrink-0 border-b bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-805 font-bangla">সাপোর্ট টিকেট</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTickets}
            disabled={loading}
            className="rounded-full hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200 ${
                filter === s
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
            >
              {s === "all" ? "সব" : STATUS_LABELS[s]}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  filter === s ? "bg-white text-slate-800" : "bg-slate-200 text-slate-700"
                }`}
              >
                {s === "all"
                  ? tickets.length
                  : tickets.filter((t) => t.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
            <span>লোডিং হচ্ছে...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
            <Inbox className="h-8 w-8 text-slate-300" />
            <p className="text-sm">কোনো টিকেট নেই</p>
          </div>
        ) : (
          filtered.map((t) => {
            const isSel = selected?.id === t.id;
            const initials = getInitials(t.user_name);
            const avatarColor = getAvatarBg(t.user_name);
            return (
              <button
                key={t.id}
                onClick={() => selectTicket(t)}
                className={`w-full p-3.5 text-left rounded-xl transition-all duration-200 border flex gap-3 ${
                  isSel
                    ? "bg-white border-sky-400 shadow-md shadow-sky-50/50 scale-[0.99]"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={t.avatar_url} alt={t.user_name} />
                  <AvatarFallback className={`font-bold text-xs ${avatarColor}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`font-semibold text-sm leading-tight truncate ${isSel ? "text-sky-950" : "text-slate-800"}`}>
                      {t.subject === "Course Reload" ? "কোর্স রিলোড" : t.subject}
                    </p>
                    <Badge className={`shrink-0 text-[9px] font-semibold tracking-wider rounded-md py-0.5 ${STATUS_BADGE_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${t.user_role === "instructor" ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                      {t.user_role === "instructor" ? "ইন্সট্রাক্টর" : "শিক্ষার্থী"}
                    </span>
                    <span className="rounded bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-500 font-medium flex items-center gap-0.5">
                      <Clock className="h-3 w-3 shrink-0" />
                      {timeAgo(t.updated_at)}
                    </span>
                  </div>
                  {t.user_name && (
                    <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                      প্রেরক: {t.user_name}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const DetailPanel = selected ? (
    <div className="flex flex-col h-full bg-slate-50/20">
      {/* Header */}
      <div className="shrink-0 border-b bg-white p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileView("list")}
            aria-label="Back to list"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-base md:text-lg leading-tight text-slate-900 truncate">
              {selected.subject === "Course Reload" ? "কোর্স রিলোড" : selected.subject}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-500">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[selected.category] || "bg-slate-100"}`}>
                {CATEGORY_LABELS[selected.category]}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-755">{selected.user_name}</span>
              <span>•</span>
              <span className={`font-bold ${selected.user_role === "instructor" ? "text-purple-600" : "text-emerald-600"}`}>
                {selected.user_role === "instructor" ? "ইন্সট্রাক্টর" : "শিক্ষার্থী"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Status management */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 pl-1">টিকেট স্ট্যাটাস:</span>
          <div className="flex gap-1.5 flex-wrap">
            {(["open", "in_progress", "resolved", "closed"] as const).map(
              (s) => {
                const isActive = selected.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? STATUS_CHIP_ACTIVE[s]
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* Reply thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {replies.map((r) => {
          const isAdmin = r.sender_role === "admin";
          const displayName = r.user_name && r.user_name !== "—" ? r.user_name : "";
          const initials = isAdmin ? "A" : getInitials(r.user_name);
          const avatarBg = getAvatarBg(r.user_name);
          const headerLabel = isAdmin
            ? (displayName ? `অ্যাডমিন (${displayName})` : "অ্যাডমিন")
            : (displayName || "ব্যবহারকারী");

          return (
            <div
              key={r.id}
              className={`flex items-start gap-2.5 ${isAdmin ? "justify-end" : "justify-start"}`}
            >
              {/* Left-side avatar for external user */}
              {!isAdmin && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={r.avatar_url} alt={r.user_name} />
                  <AvatarFallback className={`font-bold text-[10px] ${avatarBg}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[78%] rounded-2xl p-3.5 shadow-sm border ${
                  isAdmin
                    ? "bg-sky-600 text-white rounded-tr-none border-sky-700/10"
                    : "bg-white text-slate-800 rounded-tl-none border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between gap-6 mb-1">
                  <p className={`text-[10px] font-extrabold ${isAdmin ? "text-sky-100" : "text-slate-650"}`}>
                    {headerLabel}
                  </p>
                  <p className={`text-[9px] font-medium ${isAdmin ? "text-sky-200" : "text-slate-400"}`}>
                    {timeAgo(r.created_at)}
                  </p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {r.message}
                </p>
                {r.image_url && (
                  <img 
                    src={r.image_url} 
                    alt="Attachment" 
                    className="mt-2 rounded-lg max-w-full h-auto max-h-64 object-contain"
                  />
                )}
              </div>

              {/* Right-side avatar for admin */}
              {isAdmin && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={r.avatar_url} alt={r.user_name} />
                  <AvatarFallback className="bg-sky-50 border border-sky-100 text-sky-700 font-bold text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {selected.status !== "closed" ? (
        <div className="shrink-0 border-t bg-white p-3 md:p-4 shadow-lg flex flex-col gap-2">
          {replyImage && (
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
          <div className="flex gap-2.5 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="h-10 w-10 shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="এখানে আপনার উত্তর লিখুন..."
              rows={2}
              className="flex-1 resize-none text-sm rounded-xl focus-visible:ring-sky-500/30 focus-visible:border-sky-500 border-slate-200 pr-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <Button
              size="icon"
              onClick={sendReply}
              disabled={sending || (!replyText.trim() && !replyImage)}
              className="h-10 w-10 shrink-0 bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm rounded-xl"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-medium">
            <span>টিকেট সমাধান হলে স্ট্যাটাস &quot;সমাধান হয়েছে&quot; বা &quot;বন্ধ&quot; সিলেক্ট করুন।</span>
            <span className="hidden sm:inline">Ctrl + Enter দিয়ে পাঠান | ছবি আপলোড করতে ছবি আইকনে ক্লিক করুন</span>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t bg-slate-50/80 py-4 px-4 text-center text-xs font-semibold text-slate-550 flex items-center justify-center gap-1.5 border-t">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <span>এই টিকেটটি বন্ধ করা হয়েছে। গ্রাহক আবার উত্তর দিলে টিকেটটি সচল হবে।</span>
        </div>
      )}
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-slate-50/20 p-8">
      <div className="h-16 w-16 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 mb-4 animate-pulse">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-slate-800 text-sm md:text-base">কোনো টিকেট নির্বাচিত নেই</h3>
      <p className="text-xs text-slate-450 mt-1 max-w-xs text-center leading-relaxed">
        বাম দিক থেকে একটি সাপোর্ট টিকেট নির্বাচন করুন বার্তা দেখার ও উত্তর পাঠানোর জন্য।
      </p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-9.5rem)] md:h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Ticket list - hidden on mobile when detail open */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r shrink-0 flex flex-col ${mobileView === "detail" ? "hidden md:flex" : "flex"}`}
      >
        {TicketList}
      </div>
      {/* Detail panel - hidden on mobile when list showing */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
      >
        {DetailPanel}
      </div>
    </div>
  );
}
