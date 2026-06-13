"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, Upload, DollarSign, LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { href: "/instructor", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { href: "/instructor/profile", label: "আমার প্রোফাইল", icon: User },
  { href: "/instructor/courses", label: "আমার কোর্স", icon: BookOpen },
  { href: "/instructor/upload", label: "নতুন কোর্স আপলোড", icon: Upload },
  { href: "/instructor/earnings", label: "আয়", icon: DollarSign },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [isInstructor, setIsInstructor] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't apply layout to register/login pages
  const isAuthPage = pathname === "/instructor/register" || pathname === "/instructor/login";

  useEffect(() => {
    if (isAuthPage) { setIsInstructor(true); return; }

    const checkInstructor = async (session: any) => {
      if (!session) { router.push("/instructor/login"); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "instructor");
      if (!data?.length) {
        const { data: adminCheck } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
        if (adminCheck?.length) { router.push("/admin"); return; }
        router.push("/instructor/login"); return;
      }
      setIsInstructor(true);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", session.user.id).maybeSingle();
      setName(profile?.full_name || "");

      // Fetch badge counts
      const { data: courses } = await supabase.from("instructor_courses").select("status").eq("instructor_id", session.user.id);
      const pending = (courses ?? []).filter((c: any) => c.status === "pending").length;
      const draft = (courses ?? []).filter((c: any) => c.status === "draft").length;
      setBadges({
        "/instructor/courses": pending + draft,
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkInstructor(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && isInstructor === null) {
        checkInstructor(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isAuthPage]);

  if (isAuthPage) return <>{children}</>;

  if (isInstructor === null) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">যাচাই হচ্ছে...</div>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/instructor" className="flex items-center gap-2">
              <Image src="/logo.png" alt={settings.site_name} width={130} height={40} className="h-9 w-auto" priority />
              <span className="hidden rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 sm:inline">Instructor</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 md:flex">
              <User className="h-4 w-4 text-slate-500" />
              <span className="max-w-40 truncate">{name || "ইন্সট্রাক্টর"}</span>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full px-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors md:px-4" onClick={async () => { await supabase.auth.signOut(); router.push("/instructor/login"); }}>
              <LogOut className="h-4 w-4 md:mr-1" /><span className="hidden md:inline">লগ আউট</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] z-40 bg-black/20 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="max-h-[70vh] overflow-y-auto border-b bg-white px-4 pb-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1 pt-2">
              {navItems.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent ${isActive ? "bg-purple-100 text-purple-700" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {badges[item.href] > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-500 px-1.5 text-[10px] font-bold text-white">
                        {badges[item.href]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <aside className="hidden w-56 border-r bg-card md:block">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${isActive ? "bg-purple-100 text-purple-700" : ""}`}>
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {badges[item.href] > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-500 px-1.5 text-[10px] font-bold text-white">
                      {badges[item.href]}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-x-hidden p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
