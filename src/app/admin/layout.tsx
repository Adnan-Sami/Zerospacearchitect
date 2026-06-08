"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Users,
  Settings,
  Menu as MenuIcon,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Megaphone,
  Type,
  LogOut,
  User,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { NotificationBell } from "@/components/NotificationBell";

const navSections = [
  {
    title: "প্রধান",
    items: [
      { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "অর্ডার", icon: ShoppingCart },
      { href: "/admin/bookings", label: "কনসালটেন্সি বুকিং", icon: CalendarCheck },
      { href: "/admin/students", label: "শিক্ষার্থী", icon: Users },
    ],
  },
  {
    title: "কন্টেন্ট",
    items: [
      { href: "/admin/courses", label: "কোর্স", icon: BookOpen },
      { href: "/admin/books", label: "বই", icon: BookOpen },
      { href: "/admin/public-instructors", label: "প্রশিক্ষক প্রোফাইল", icon: Users },
      { href: "/admin/slides", label: "হিরো স্লাইডার", icon: ImageIcon },
      { href: "/admin/banners", label: "প্রোমো ব্যানার", icon: Megaphone },
      { href: "/admin/testimonials", label: "টেস্টিমোনিয়াল", icon: MessageSquare },
      { href: "/admin/seminars", label: "সেমিনার", icon: BookOpen },
      { href: "/admin/services", label: "ডিজাইন ও কনসালটেন্সি", icon: BookOpen },
    ],
  },
  {
    title: "ইন্সট্রাক্টর",
    items: [
      { href: "/admin/instructor-courses", label: "কোর্স রিভিউ", icon: BookOpen },
      { href: "/admin/instructors", label: "তালিকা ও আয়", icon: Users },
      { href: "/admin/instructor-profiles", label: "প্রোফাইল সাবমিশন", icon: Users },
    ],
  },
  {
    title: "সেটিংস",
    items: [
      { href: "/admin/content", label: "সাইট কন্টেন্ট", icon: Type },
      { href: "/admin/pages", label: "কাস্টম পেজ", icon: FileText },
      { href: "/admin/menu", label: "মেনু", icon: MenuIcon },
      { href: "/admin/subscribers", label: "সাবস্ক্রাইবার", icon: Users },
      { href: "/admin/settings", label: "সাইট সেটিংস", icon: Settings },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUserName(session.user.email ?? "অ্যাডমিন");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single();
      if (profile?.full_name) setUserName(profile.full_name);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");
      if (!data?.length) {
        router.push("/");
        return;
      }
      setIsAdmin(true);

      // Fetch pending counts for sidebar badges (only actionable items)
      const [
        { count: pendingOrders },
        { count: pendingBookOrders },
        { count: pendingInstructorCourses },
        { count: pendingInstructorApps },
        { count: pendingBookingsNew },
        { count: pendingBookingsNull },
        { count: unseenProfiles },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("book_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("instructor_courses").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("service_type", "instructor_application").eq("status", "new"),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).ilike("service_type", "%কনসালটেন্সি%").eq("status", "new"),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).ilike("service_type", "%কনসালটেন্সি%").is("status", null),
        supabase.from("instructor_profile_details").select("*", { count: "exact", head: true }).eq("is_seen", false),
      ]);
      setBadges({
        "/admin/orders": (pendingOrders ?? 0) + (pendingBookOrders ?? 0),
        "/admin/instructor-courses": (pendingInstructorCourses ?? 0) + (pendingInstructorApps ?? 0),
        "/admin/bookings": (pendingBookingsNew ?? 0) + (pendingBookingsNull ?? 0),
        "/admin/instructor-profiles": unseenProfiles ?? 0,
      });
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isAdmin === null)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        যাচাই হচ্ছে...
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt={settings.site_name || "ZeroSpace Architect"}
              width={140}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 md:flex">
              <User className="h-4 w-4 text-slate-500" />
              <span className="max-w-60 truncate">লগইন: {userName || "অ্যাডমিন"}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              লগ আউট
            </Button>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 md:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <User className="h-4 w-4 text-slate-500" />
            <span className="truncate">লগইন: {userName || "অ্যাডমিন"}</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-56 border-r bg-card md:block">
          <nav className="space-y-4 p-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href) && pathname !== "/admin";
                    const exactActive = item.exact && pathname === "/admin";
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                          exactActive || (!item.exact && isActive)
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {badges[item.href] > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {badges[item.href]}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
