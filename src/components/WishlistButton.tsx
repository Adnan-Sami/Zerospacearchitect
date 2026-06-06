"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WishlistButton({
  courseId,
  className,
}: {
  courseId: string;
  className?: string;
}) {
  const [inWishlist, setInWishlist] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .maybeSingle();
      setInWishlist(!!data);
    });
  }, [courseId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      toast.error("লগ-ইন করুন");
      return;
    }
    if (inWishlist) {
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);
      setInWishlist(false);
      toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
    } else {
      const { error } = await supabase
        .from("wishlist")
        .insert({ user_id: userId, course_id: courseId });
      if (error) {
        toast.error(error.message);
        return;
      }
      setInWishlist(true);
      toast.success("উইশলিস্টে যোগ হয়েছে");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label="উইশলিস্ট"
    >
      <Heart
        className={`h-5 w-5 ${
          inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"
        }`}
      />
    </Button>
  );
}
