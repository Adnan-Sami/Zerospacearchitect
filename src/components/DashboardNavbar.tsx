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
    router.push("/");
  };

  const navLinks = [
    { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { href: "/my-courses", label: "আমার কোর্স", icon: BookOpen },
    { href: "/profile", label: "প্রোফাইল", icon: User },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt={settings.site_name || "ZeroSpace Architect"}
              width={130}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <Home className="mr-1 inline h-4 w-4" />সাইটে যান
            </Link>
            <NotificationBell />
            {fullName && (
              <span className="text-sm font-medium text-slate-700">{fullName}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
              <LogOut className="mr-1 h-4 w-4" />লগ আউট
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(l.href) ? "bg-sky-50 text-sky-600" : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              <Home className="h-4 w-4" />সাইটে যান
            </Link>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <NotificationBell />
              <span className="text-sm text-slate-600">নোটিফিকেশন</span>
            </div>
            <hr className="my-1" />
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-slate-100"
              onClick={() => { handleLogout(); setMobileOpen(false); }}
            >
              <LogOut className="h-4 w-4" />লগ আউট
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
