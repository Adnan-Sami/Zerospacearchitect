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
  X,
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
      { href: "/admin/banners", label: "প্রোমো ব্যানার", icon: Megaphone },
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
      { href: "/admin/refund-policy", label: "রিফান্ড পলিসি", icon: FileText },
      { href: "/admin/subscribers", label: "সাবস্ক্রাইবার", icon: Users },
      { href: "/admin/coupons", label: "কুপন কোড", icon: Type },
      { href: "/admin/settings", label: "পেমেন্ট সেটিংস", icon: Settings },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Skip layout for login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setIsAdmin(true); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/admin/login");
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
    router.push("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (isAdmin === null)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        যাচাই হচ্ছে...
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
            <Link href="/admin" className="flex shrink-0 items-center gap-2">
              <Image
                src="/logo.png"
                alt={settings.site_name || "ZeroSpace Architect"}
                width={140}
                height={44}
                className="h-10 w-auto"
                priority
              />
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 md:flex">
              <User className="h-4 w-4 text-slate-500" />
              <span className="max-w-60 truncate">লগইন: {userName || "অ্যাডমিন"}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-full border-slate-200 px-3 text-slate-700 hover:bg-slate-50 md:px-4"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">লগ আউট</span>
            </Button>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 md:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{userName || "অ্যাডমিন"}</span>
          </div>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] z-40 bg-black/20 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="max-h-[80vh] overflow-y-auto border-b bg-white px-4 pb-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1 pt-2">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>
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
                          exactActive || (!item.exact && isActive) ? "bg-primary/10 text-primary" : ""
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
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
              ))}
            </nav>
          </div>
        </div>
      )}

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
        <main className="flex-1 overflow-x-hidden p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
