"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, BookOpen, User, LayoutDashboard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { NotificationBell } from "@/components/NotificationBell";

const navLinks = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { href: "/my-courses", label: "আমার কোর্স", icon: BookOpen },
  { href: "/profile", label: "প্রোফাইল", icon: User },
];

/**
 * Header-only navbar for the student portal.
 * Used by pages like /learn/[courseId] that have their own layout.
 */
export function DashboardNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSiteSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single().then(({ data }) => {
          setFullName(data?.full_name || "");
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt={settings.site_name || "ZeroSpace Architect"}
              width={130}
              height={40}
              className="h-9 w-auto"
              priority
            />
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Student</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 md:flex">
            <User className="h-4 w-4 text-slate-500" />
            <span className="max-w-40 truncate">{fullName || "শিক্ষার্থী"}</span>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            লগ আউট
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              <Home className="h-4 w-4" />সাইটে যান
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/**
 * Full layout with header + sidebar for student portal pages.
 * Used by /dashboard, /my-courses, /profile.
 */
export function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSiteSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single().then(({ data }) => {
          setFullName(data?.full_name || "");
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
              <Image
                src="/logo.png"
                alt={settings.site_name || "ZeroSpace Architect"}
                width={130}
                height={40}
                className="h-9 w-auto"
                priority
              />
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Student</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 md:flex">
              <User className="h-4 w-4 text-slate-500" />
              <span className="max-w-40 truncate">{fullName || "শিক্ষার্থী"}</span>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              লগ আউট
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t bg-white px-4 pb-4 md:hidden">
            <nav className="flex flex-col gap-1 pt-3">
              {navLinks.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                <Home className="h-4 w-4" />সাইটে যান
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 border-r bg-card md:block">
          <nav className="space-y-1 p-4">
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                    active ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-3 border-t" />
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              সাইটে যান
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
