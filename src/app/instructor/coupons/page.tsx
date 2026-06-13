"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CouponEditor,
  emptyCouponForm,
  saveCouponRequest,
  deleteCouponRequest,
  type CouponFormState,
} from "@/components/coupon-editor";

export default function InstructorCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ id: string; label: string }[]>([]);
  const [books, setBooks] = useState<{ id: string; label: string }[]>([]);
  const [editing, setEditing] = useState<CouponFormState | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    const [{ data: couponData }, { data: instCourses }, { data: bookData }] = await Promise.all([
      supabase.from("coupons").select("*").eq("instructor_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("instructor_courses").select("course_id, course_title").eq("instructor_id", session.user.id).eq("status", "approved"),
      supabase.from("books").select("id, title").eq("is_published", true).order("title"),
    ]);

    setCoupons(couponData ?? []);
    setCourses((instCourses ?? []).map((c: any) => ({ id: c.course_id, label: c.course_title })));
    setBooks((bookData ?? []).map((b: any) => ({ id: b.id, label: b.title })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const canEdit = useMemo(() => {
    if (!editing) return true;
    return !editing.id || editing.approval_status !== "approved";
  }, [editing]);

  const openEdit = async (coupon: any) => {
    if (coupon.approval_status === "approved") {
      toast.error("অনুমোদিত কুপন এডিট করা যাবে না");
      return;
    }

    setEditing({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses ?? "",
      per_user_limit: coupon.per_user_limit ?? "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
      is_active: coupon.is_active,
      scope: "instructor",
      instructor_id: userId,
      applies_to_courses: coupon.applies_to_courses ?? true,
      applies_to_books: coupon.applies_to_books ?? true,
      all_courses: coupon.all_courses ?? true,
      all_books: coupon.all_books ?? true,
      approval_status: coupon.approval_status,
    });

    const [{ data: courseLinks }, { data: bookLinks }] = await Promise.all([
      supabase.from("coupon_allowed_courses").select("course_id").eq("coupon_id", coupon.id),
      supabase.from("coupon_allowed_books").select("book_id").eq("coupon_id", coupon.id),
    ]);
    setSelectedCourseIds((courseLinks ?? []).map((c: any) => c.course_id));
    setSelectedBookIds((bookLinks ?? []).map((b: any) => b.book_id));
  };

  const save = async () => {
    if (!editing) return;
    try {
      await saveCouponRequest(
        { ...editing, scope: "instructor", instructor_id: userId },
        selectedCourseIds,
        selectedBookIds
      );
      toast.success("অ্যাডমিন অনুমোদনের জন্য জমা দেওয়া হয়েছে");
      setEditing(null);
      setSelectedCourseIds([]);
      setSelectedBookIds([]);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const del = async (id: string, status: string) => {
    if (status === "approved") {
      toast.error("অনুমোদিত কুপন ডিলিট করা যাবে না");
      return;
    }
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await deleteCouponRequest(id);
      toast.success("ডিলিট হয়েছে");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusBadge = (coupon: any) => {
    if (coupon.approval_status === "pending") {
      return <Badge className="bg-amber-100 text-amber-800">অ্যাডমিন অনুমোদন অপেক্ষমান</Badge>;
    }
    if (coupon.approval_status === "rejected") {
      return <Badge className="bg-red-100 text-red-700">প্রত্যাখ্যাত</Badge>;
    }
    return coupon.is_active ? (
      <Badge className="bg-green-100 text-green-700">অ্যাক্টিভ</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600">নিষ্ক্রিয়</Badge>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">আমার কুপন</h1>
          <p className="text-sm text-muted-foreground">কুপন তৈরি করুন — অ্যাডমিন অনুমোদনের পর সক্রিয় হবে</p>
        </div>
        <Button onClick={() => {
          setEditing(emptyCouponForm({ scope: "instructor", instructor_id: userId, applies_to_courses: true, applies_to_books: false, all_books: false }));
          setSelectedCourseIds([]);
          setSelectedBookIds([]);
        }}>
          <Plus className="mr-1 h-4 w-4" />নতুন কুপন
        </Button>
      </div>

      {editing && (
        <CouponEditor
          title={editing.id ? "কুপন এডিট" : "নতুন কুপন"}
          editing={editing}
          setEditing={setEditing}
          courses={courses}
          books={books}
          selectedCourseIds={selectedCourseIds}
          setSelectedCourseIds={setSelectedCourseIds}
          selectedBookIds={selectedBookIds}
          setSelectedBookIds={setSelectedBookIds}
          onSave={save}
          onCancel={() => { setEditing(null); setSelectedCourseIds([]); setSelectedBookIds([]); }}
          mode="instructor"
          readOnly={!canEdit}
        />
      )}

      <div className="space-y-3">
        {coupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-lg font-bold">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ছাড়`}
                  {c.applies_to_courses ? (c.all_courses ? " · সব কোর্স" : " · নির্বাচিত কোর্স") : ""}
                  {c.applies_to_books ? (c.all_books ? " · সব বই" : " · নির্বাচিত বই") : ""}
                  {c.max_uses ? ` · সীমা: ${c.used_count || 0}/${c.max_uses}` : ` · ব্যবহার: ${c.used_count || 0}`}
                </p>
                {c.rejection_reason && (
                  <p className="mt-1 text-xs text-red-600">কারণ: {c.rejection_reason}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(c)}
                {c.approval_status !== "approved" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => del(c.id, c.approval_status)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">কোনো কুপন নেই।</p>
        )}
      </div>
    </div>
  );
}
