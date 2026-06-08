"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, Upload, DollarSign, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { href: "/instructor", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
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

  // Don't apply layout to register/login pages
  const isAuthPage = pathname === "/instructor/register" || pathname === "/instructor/login";

  useEffect(() => {
    if (isAuthPage) { setIsInstructor(true); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/instructor/login"); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "instructor");
      if (!data?.length) {
        const { data: adminCheck } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
        if (!adminCheck?.length) { router.push("/instructor/login"); return; }
      }
      setIsInstructor(true);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single();
      setName(profile?.full_name || "");

      // Fetch badge counts
      const { data: courses } = await supabase.from("instructor_courses").select("status").eq("instructor_id", session.user.id);
      const pending = (courses ?? []).filter((c: any) => c.status === "pending").length;
      const draft = (courses ?? []).filter((c: any) => c.status === "draft").length;
      setBadges({
        "/instructor/courses": pending + draft,
      });
    });
  }, [router, isAuthPage]);

  if (isAuthPage) return <>{children}</>;

  if (isInstructor === null) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">যাচাই হচ্ছে...</div>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/instructor" className="flex items-center gap-2">
            <Image src="/logo.png" alt={settings.site_name} width={130} height={40} className="h-9 w-auto" priority />
            <span className="hidden rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 sm:inline">Instructor</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm font-medium text-slate-700 md:inline">{name}</span>
            <Button variant="outline" size="sm" className="rounded-full" onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}>
              <LogOut className="mr-1 h-4 w-4" />লগ আউট
            </Button>
          </div>
        </div>
      </header>
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
