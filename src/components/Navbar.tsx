"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu, X, User, LogOut, BookOpen, Heart, Search,
  Home, Book, FileText, Headphones, Building2, LayoutDashboard, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSiteSettings();

  useEffect(() => {
    const fetchWishlistCount = async (userId: string) => {
      const { count } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      setWishlistCount(count ?? 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
          setIsAdmin(!!data?.length);
        });
        fetchWishlistCount(session.user.id);
      } else {
        setIsAdmin(false);
        setWishlistCount(0);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
          setIsAdmin(!!data?.length);
        });
        fetchWishlistCount(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Listen for wishlist updates from WishlistButton
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (user) {
        supabase
          .from("wishlist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .then(({ count }) => setWishlistCount(count ?? 0));
      }
    };
    window.addEventListener("wishlist-updated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlist-updated", handleWishlistUpdate);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };

  // Fetch search suggestions
  useEffect(() => {
    if (searchTerm.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, instructor_name")
        .eq("is_published", true)
        .or(`title.ilike.%${searchTerm}%,instructor_name.ilike.%${searchTerm}%`)
        .limit(5);
      setSuggestions(data ?? []);
      setShowSuggestions(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const navLinks = [
    { href: "/", label: "হোম", icon: Home },
    { href: "/courses", label: "কোর্স", icon: Book },
    { href: "/books", label: "বই", icon: FileText },
    { href: "/services", label: "ডিজাইন ও কনসালটেন্সি", icon: Building2 },
    { href: "/support", label: "সাপোর্ট", icon: Headphones },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50">
      <div className="mx-auto max-w-380 px-3 py-3 sm:px-4 lg:px-5">
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200/80 bg-white px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:px-4 lg:gap-4 lg:px-5">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 pr-1">
            <Image
              src="/logo.png"
              alt={settings.site_name || "ZeroSpace Architect"}
              width={140}
              height={44}
              className="h-10 sm:h-11"
              style={{ width: "auto", height: "auto", maxHeight: "44px" }}
              priority
            />
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 md:block lg:max-w-107.5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="কোর্স খুঁজুন..."
                className="h-12 rounded-full border-0 bg-slate-100/80 pl-11 pr-10 text-sm shadow-inner shadow-slate-200/70 ring-1 ring-transparent placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searchTerm && (
                <button type="button" onClick={() => { setSearchTerm(""); setSuggestions([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-white shadow-xl">
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground">সার্চ রেজাল্ট</p>
                  {suggestions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/courses/${s.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors"
                      onClick={() => setShowSuggestions(false)}
                    >
                      {s.thumbnail_url ? (
                        <Image src={s.thumbnail_url} alt="" width={48} height={32} className="h-8 w-12 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-muted text-[8px] text-muted-foreground">IMG</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        {s.instructor_name && <p className="text-[11px] text-muted-foreground">{s.instructor_name}</p>}
                      </div>
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 border-t px-4 py-2.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                    onClick={() => { handleSearch({ preventDefault: () => {} } as React.FormEvent); }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    &ldquo;{searchTerm}&rdquo; দিয়ে সব কোর্স দেখুন
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <div className="flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              {navLinks.map((l) => {
                const active = isActive(l.href);

                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-sky-600 text-white shadow-[0_8px_18px_rgba(2,132,199,0.3)]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              {user && (
                <Link
                  href="/wishlist"
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    pathname === "/wishlist"
                      ? "bg-sky-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-label="উইশলিস্ট"
                >
                  <Heart className="h-4 w-4" />
                  {wishlistCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith("/admin")
                      ? "bg-sky-600 text-white shadow-[0_8px_18px_rgba(2,132,199,0.3)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  অ্যাডমিন
                </Link>
              )}
            </div>
          </div>

          {/* Auth */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 text-slate-700 hover:bg-slate-100">
                    <User className="mr-1 h-4 w-4" />ড্যাশবোর্ড
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full border-slate-200 px-4 text-slate-700 hover:bg-slate-50">
                  <LogOut className="mr-1 h-4 w-4" />লগ আউট
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="rounded-full bg-sky-600 px-6 font-semibold text-white shadow-[0_10px_24px_rgba(2,132,199,0.26)] hover:bg-sky-700">
                  লগ-ইন
                </Button>
              </Link>
            )}
          </div>

          <button className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="মেনু">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <form onSubmit={handleSearch} className="pt-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="কোর্স খুঁজুন..."
                className="h-11 rounded-full border-slate-200 bg-slate-100/80 pl-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                <l.icon className="h-4 w-4 text-slate-500" />{l.label}
              </Link>
            ))}

            {user && (
              <>
                <hr className="my-2" />
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">আমার অ্যাকাউন্ট</p>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="h-4 w-4 text-slate-500" />ড্যাশবোর্ড
                </Link>
                <Link href="/my-courses" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  <BookOpen className="h-4 w-4 text-slate-500" />আমার কোর্স
                </Link>
                <Link href="/wishlist" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  <Heart className="h-4 w-4 text-slate-500" />উইশলিস্ট
                </Link>
                <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  <User className="h-4 w-4 text-slate-500" />প্রোফাইল
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    <Shield className="h-4 w-4 text-slate-500" />অ্যাডমিন
                  </Link>
                )}
                <hr className="my-2" />
                <button className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-red-50" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4" />লগ আউট
                </button>
              </>
            )}

            {!user && (
              <>
                <hr className="my-2" />
                <Link href="/login" className="rounded-full bg-sky-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg" onClick={() => setMobileOpen(false)}>লগ-ইন</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
