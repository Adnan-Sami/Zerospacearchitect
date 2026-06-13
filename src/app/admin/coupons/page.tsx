"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CouponEditor,
  emptyCouponForm,
  saveCouponRequest,
  approveCouponRequest,
  rejectCouponRequest,
  deleteCouponRequest,
  type CouponFormState,
} from "@/components/coupon-editor";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; label: string }[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: string; label: string; instructor_id?: string }[]>([]);
  const [allBooks, setAllBooks] = useState<{ id: string; label: string }[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [editing, setEditing] = useState<CouponFormState | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "pending">("all");

  const load = useCallback(async () => {
    const [{ data: couponData }, { data: roles }, { data: courses }, { data: books }, { data: instCourses }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("courses").select("id, title").order("title"),
      supabase.from("books").select("id, title").eq("is_published", true).order("title"),
      supabase.from("instructor_courses").select("instructor_id, course_id, course_title, status").eq("status", "approved"),
    ]);

    setCoupons(couponData ?? []);
    setAllCourses((courses ?? []).map((c: any) => ({ id: c.id, label: c.title })));
    setAllBooks((books ?? []).map((b: any) => ({ id: b.id, label: b.title })));
    setInstructorCourses(instCourses ?? []);

    const userIds = (roles ?? []).map((r: any) => r.user_id);
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      setInstructors((profiles ?? []).map((p: any) => ({ id: p.user_id, label: p.full_name || p.user_id })));
    } else {
      setInstructors([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const instructorNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    instructors.forEach((i) => { map[i.id] = i.label; });
    return map;
  }, [instructors]);

  const courseOptions = useMemo(() => {
    if (!editing) return allCourses;
    if (editing.scope === "instructor" && editing.instructor_id) {
      const ids = new Set(
        instructorCourses
          .filter((ic) => ic.instructor_id === editing.instructor_id)
          .map((ic) => ic.course_id)
      );
      return allCourses.filter((c) => ids.has(c.id));
    }
    return allCourses;
  }, [editing, allCourses, instructorCourses]);

  const openEdit = async (coupon: any) => {
    setEditing({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses ?? "",
      per_user_limit: coupon.per_user_limit ?? "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
      is_active: coupon.is_active,
      scope: coupon.scope || "global",
      instructor_id: coupon.instructor_id || "",
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
      await saveCouponRequest(editing, selectedCourseIds, selectedBookIds);
      toast.success("সেভ হয়েছে");
      setEditing(null);
      setSelectedCourseIds([]);
      setSelectedBookIds([]);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const del = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await deleteCouponRequest(id);
      toast.success("ডিলিট হয়েছে");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const approve = async (id: string) => {
    try {
      await approveCouponRequest(id);
      toast.success("অনুমোদিত হয়েছে");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt("প্রত্যাখ্যানের কারণ (ঐচ্ছিক)") || undefined;
    try {
      await rejectCouponRequest(id, reason);
      toast.success("প্রত্যাখ্যান করা হয়েছে");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredCoupons = filter === "pending"
    ? coupons.filter((c) => c.approval_status === "pending")
    : coupons;

  const statusBadge = (coupon: any) => {
    if (coupon.approval_status === "pending") {
      return <Badge className="bg-amber-100 text-amber-800">অপেক্ষমান</Badge>;
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
          <h1 className="text-2xl font-bold">কুপন ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">গ্লোবাল ও ইন্সট্রাক্টর-নির্দিষ্ট কুপন পরিচালনা</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>সব</Button>
          <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>
            অপেক্ষমান ({coupons.filter((c) => c.approval_status === "pending").length})
          </Button>
          <Button onClick={() => {
            setEditing(emptyCouponForm());
            setSelectedCourseIds([]);
            setSelectedBookIds([]);
          }}>
            <Plus className="mr-1 h-4 w-4" />নতুন কুপন
          </Button>
        </div>
      </div>

      {editing && (
        <CouponEditor
          title={editing.id ? "এডিট কুপন" : "নতুন কুপন"}
          editing={editing}
          setEditing={setEditing}
          instructors={instructors}
          courses={courseOptions}
          books={allBooks}
          selectedCourseIds={selectedCourseIds}
          setSelectedCourseIds={setSelectedCourseIds}
          selectedBookIds={selectedBookIds}
          setSelectedBookIds={setSelectedBookIds}
          onSave={save}
          onCancel={() => { setEditing(null); setSelectedCourseIds([]); setSelectedBookIds([]); }}
          mode="admin"
        />
      )}

      <div className="space-y-3">
        {filteredCoupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-lg font-bold">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ছাড়`}
                  {c.scope === "instructor" && c.instructor_id ? ` · ইন্সট্রাক্টর: ${instructorNameMap[c.instructor_id] || "—"}` : " · গ্লোবাল"}
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
                {c.approval_status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" className="text-green-700" onClick={() => approve(c.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-700" onClick={() => reject(c.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredCoupons.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">কোনো কুপন নেই।</p>
        )}
      </div>
    </div>
  );
}
