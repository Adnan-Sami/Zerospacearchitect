import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, BookOpen, Heart, Search, Home, Book, FileText, Headphones, Building2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { useSiteSettings } from "@/hooks/use-site-settings";
import logoImg from "@/assets/logo.png";

export function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const settings = useSiteSettings();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
          setIsAdmin(!!data?.length);
        });
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
          setIsAdmin(!!data?.length);
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/courses?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const navLinks = [
    { to: "/", label: "হোম", icon: Home },
    { to: "/courses", label: "কোর্স", icon: Book },
    { to: "/books", label: "বই", icon: FileText },
    { to: "/services", label: "ডিজাইন ও কনসালটেন্সি", icon: Building2 },
    { to: "/support", label: "সাপোর্ট", icon: Headphones },
    { to: "/register", label: "রেজিস্ট্রেশন", icon: UserPlus },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src={logoImg}
              alt={settings.site_name || "ZeroSpace Architect"}
              className="h-10 w-auto"
            />
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="কোর্স খুঁজুন"
                className="h-10 rounded-full border-muted bg-muted/40 pl-11 pr-4 focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            {user && (
              <Link to="/wishlist" className="text-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
                <Heart className="h-5 w-5" />
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>অ্যাডমিন</Link>
            )}
          </div>

          {/* Auth */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm"><User className="mr-1 h-4 w-4" />ড্যাশবোর্ড</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-1 h-4 w-4" />লগ আউট</Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-full px-6">লগ-ইন</Button>
              </Link>
            )}
          </div>

          <button className="ml-auto md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card px-4 pb-4 md:hidden">
          <form onSubmit={handleSearch} className="pt-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="কোর্স খুঁজুন"
                className="h-10 rounded-full border-muted bg-muted/40 pl-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            ))}
            {user && <Link to="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>ড্যাশবোর্ড</Link>}
            {user && <Link to="/my-courses" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>আমার কোর্স</Link>}
            {user && <Link to="/wishlist" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>উইশলিস্ট</Link>}
            {isAdmin && <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>অ্যাডমিন</Link>}
            <hr className="my-1" />
            {user ? (
              <>
                <Link to="/profile" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>প্রোফাইল</Link>
                <button className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent" onClick={() => { handleLogout(); setMobileOpen(false); }}>লগ আউট</button>
              </>
            ) : (
              <Link to="/login" className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground" onClick={() => setMobileOpen(false)}>লগ-ইন</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
