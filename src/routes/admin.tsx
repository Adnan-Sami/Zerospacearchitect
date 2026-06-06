import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, ShoppingCart, Users, Settings, Menu as MenuIcon, FileText, Image, MessageSquare, Megaphone, Type } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (!data?.length) { navigate({ to: "/" }); return; }
      setIsAdmin(true);
    });
  }, [navigate]);

  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">যাচাই হচ্ছে...</div>;

  const navItems = [
    { to: "/admin" as const, label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
    { to: "/admin/courses" as const, label: "কোর্স", icon: BookOpen },
    { to: "/admin/orders" as const, label: "অর্ডার", icon: ShoppingCart },
    { to: "/admin/students" as const, label: "শিক্ষার্থী", icon: Users },
    { to: "/admin/slides" as const, label: "হিরো স্লাইডার", icon: Image },
    { to: "/admin/banners" as const, label: "প্রোমো ব্যানার", icon: Megaphone },
    { to: "/admin/testimonials" as const, label: "টেস্টিমোনিয়াল", icon: MessageSquare },
    { to: "/admin/content" as const, label: "সাইট কন্টেন্ট", icon: Type },
    { to: "/admin/pages" as const, label: "কাস্টম পেজ", icon: FileText },
    { to: "/admin/menu" as const, label: "মেনু", icon: MenuIcon },
    { to: "/admin/settings" as const, label: "সাইট সেটিংস", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden w-56 border-r bg-card md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
