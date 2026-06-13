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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isInstructor = pathname.startsWith("/instructor");

  const isCurrentPortalNotification = useCallback(
    (notification: Notification) => {
      const link = notification.link || "";
      if (isAdmin) return link.startsWith("/admin");
      if (isInstructor) return link.startsWith("/instructor");
      return !link.startsWith("/admin") && !link.startsWith("/instructor");
    },
    [isAdmin, isInstructor],
  );

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
      .limit(50);

    if (data) {
      const filtered = (data as Notification[]).filter(
        isCurrentPortalNotification,
      );
      setNotifications(filtered);
      const count = filtered.filter((n) => !n.is_read).length;
      setUnreadCount(count);
      const baseTitle = "Zero Space Architect";
      document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
    }
  }, [isCurrentPortalNotification]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markVisibleRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .in("id", unreadIds);

    setNotifications((items) => items.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    document.title = "Zero Space Architect";
  }, [notifications]);

  const markAllRead = async () => {
    await markVisibleRead();
    fetchNotifications();
  };

  useEffect(() => {
    if (open) void markVisibleRead();
  }, [open, markVisibleRead]);

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.user.id)
        .eq("id", notif.id);
      fetchNotifications();
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) void markVisibleRead();
      }}
    >
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
