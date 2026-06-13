"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "এইমাত্র";
  if (diffMin < 60) return `${diffMin} মিনিট আগে`;
  if (diffHour < 24) return `${diffHour} ঘণ্টা আগে`;
  if (diffDay === 1) return "গতকাল";
  if (diffDay < 7) return `${diffDay} দিন আগে`;
  return date.toLocaleDateString("bn-BD");
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isInstructor = pathname.startsWith("/instructor");

  const fetchNotifications = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      // Filter notifications by current portal
      const filtered = (data as Notification[]).filter((n) => {
        if (!n.link) return true; // No link = show everywhere
        if (isAdmin) {
          return n.link.startsWith("/admin");
        } else if (isInstructor) {
          return n.link.startsWith("/instructor");
        } else {
          // Student portal: show only /dashboard or /learn links
          return !n.link.startsWith("/admin") && !n.link.startsWith("/instructor");
        }
      });
      setNotifications(filtered);
      const count = filtered.filter((n) => !n.is_read).length;
      setUnreadCount(count);
      const baseTitle = "Zero Space Architect";
      document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
    }
  }, [isAdmin, isInstructor]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    fetchNotifications();
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
      fetchNotifications();
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">নোটিফিকেশন</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              সব পঠিত
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              কোনো নোটিফিকেশন নেই
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`block w-full border-b px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                  !notif.is_read ? "bg-sky-50/50" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                  )}
                  <div className={!notif.is_read ? "" : "pl-4"}>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
