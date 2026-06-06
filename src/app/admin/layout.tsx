"use client";

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
  Image,
  MessageSquare,
  Megaphone,
  Type,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "কোর্স", icon: BookOpen },
  { href: "/admin/orders", label: "অর্ডার", icon: ShoppingCart },
  { href: "/admin/students", label: "শিক্ষার্থী", icon: Users },
  { href: "/admin/slides", label: "হিরো স্লাইডার", icon: Image },
  { href: "/admin/banners", label: "প্রোমো ব্যানার", icon: Megaphone },
  { href: "/admin/testimonials", label: "টেস্টিমোনিয়াল", icon: MessageSquare },
  { href: "/admin/content", label: "সাইট কন্টেন্ট", icon: Type },
  { href: "/admin/pages", label: "কাস্টম পেজ", icon: FileText },
  { href: "/admin/menu", label: "মেনু", icon: MenuIcon },
  { href: "/admin/settings", label: "সাইট সেটিংস", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
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
    });
  }, [router]);

  if (isAdmin === null)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        যাচাই হচ্ছে...
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden w-56 border-r bg-card md:block">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
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
                  {item.label}
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
