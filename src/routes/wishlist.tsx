import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      const { data } = await supabase
        .from("wishlist")
        .select("course_id, courses(*, categories(name))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold"><Heart className="h-6 w-6 text-red-500" />আমার উইশলিস্ট</h1>
        {loading ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">আপনার উইশলিস্ট খালি।</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => item.courses && (
              <CourseCard
                key={item.course_id}
                id={item.courses.id}
                title={item.courses.title}
                thumbnailUrl={item.courses.thumbnail_url}
                price={Number(item.courses.price)}
                instructorName={item.courses.instructor_name}
                categoryName={item.courses.categories?.name}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
