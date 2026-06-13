"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export type CouponFormState = {
  id?: string;
  code: string;
  discount_type: string;
  discount_value: string | number;
  max_uses: string | number;
  per_user_limit: string | number;
  expires_at: string;
  is_active: boolean;
  scope: "global" | "instructor";
  instructor_id: string;
  applies_to_courses: boolean;
  applies_to_books: boolean;
  all_courses: boolean;
  all_books: boolean;
  approval_status?: string;
};

type Option = { id: string; label: string };

type CouponEditorProps = {
  title: string;
  editing: CouponFormState;
  setEditing: (value: CouponFormState) => void;
  instructors?: Option[];
  courses: Option[];
  books: Option[];
  selectedCourseIds: string[];
  setSelectedCourseIds: (ids: string[]) => void;
  selectedBookIds: string[];
  setSelectedBookIds: (ids: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  mode: "admin" | "instructor";
  readOnly?: boolean;
};

export function CouponEditor({
  title,
  editing,
  setEditing,
  instructors = [],
  courses,
  books,
  selectedCourseIds,
  setSelectedCourseIds,
  selectedBookIds,
  setSelectedBookIds,
  onSave,
  onCancel,
  mode,
  readOnly = false,
}: CouponEditorProps) {
  const toggleId = (
    ids: string[],
    id: string,
    setter: (next: string[]) => void,
  ) => {
    setter(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "admin" && (
          <div>
            <Label>কুপন ধরন</Label>
            <select
              value={editing.scope}
              disabled={readOnly}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  scope: e.target.value as "global" | "instructor",
                  instructor_id:
                    e.target.value === "global" ? "" : editing.instructor_id,
                })
              }
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="global">গ্লোবাল (সবার জন্য)</option>
              <option value="instructor">ইন্সট্রাক্টর-নির্দিষ্ট</option>
            </select>
          </div>
        )}

        {mode === "admin" && editing.scope === "instructor" && (
          <div>
            <Label>ইন্সট্রাক্টর *</Label>
            <select
              value={editing.instructor_id}
              disabled={readOnly}
              onChange={(e) => {
                setEditing({ ...editing, instructor_id: e.target.value });
                setSelectedCourseIds([]);
              }}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">ইন্সট্রাক্টর নির্বাচন করুন</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>কুপন কোড *</Label>
            <Input
              value={editing.code}
              disabled={readOnly}
              onChange={(e) =>
                setEditing({ ...editing, code: e.target.value.toUpperCase() })
              }
              placeholder="যেমন: SAVE20"
            />
          </div>
          <div>
            <Label>ডিসকাউন্ট টাইপ</Label>
            <select
              value={editing.discount_type}
              disabled={readOnly}
              onChange={(e) =>
                setEditing({ ...editing, discount_type: e.target.value })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="fixed">নির্দিষ্ট পরিমাণ (৳)</option>
              <option value="percent">শতাংশ (%)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label>ডিসকাউন্ট মান *</Label>
            <Input
              type="number"
              disabled={readOnly}
              value={editing.discount_value}
              onChange={(e) =>
                setEditing({ ...editing, discount_value: e.target.value })
              }
            />
          </div>
          <div>
            <Label>সর্বোচ্চ ব্যবহার</Label>
            <Input
              type="number"
              disabled={readOnly}
              value={editing.max_uses}
              onChange={(e) =>
                setEditing({ ...editing, max_uses: e.target.value })
              }
              placeholder="খালি = সীমাহীন"
            />
          </div>
          <div>
            <Label>প্রতি ইউজার সীমা</Label>
            <Input
              type="number"
              disabled={readOnly}
              value={editing.per_user_limit}
              onChange={(e) =>
                setEditing({ ...editing, per_user_limit: e.target.value })
              }
              placeholder="খালি = সীমাহীন"
            />
          </div>
          <div>
            <Label>মেয়াদ শেষ</Label>
            <Input
              type="datetime-local"
              disabled={readOnly}
              value={editing.expires_at}
              onChange={(e) =>
                setEditing({ ...editing, expires_at: e.target.value })
              }
            />
          </div>
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">প্রযোজ্য পণ্য</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={editing.applies_to_courses}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    applies_to_courses: e.target.checked,
                  })
                }
              />
              কোর্স
            </label>
            {mode === "admin" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={editing.applies_to_books}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      applies_to_books: e.target.checked,
                    })
                  }
                />
                বই
              </label>
            )}
          </div>

          {editing.applies_to_courses && (
            <div className="space-y-2">
              <Label>কোর্স স্কোপ</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={readOnly}
                    checked={editing.all_courses}
                    onChange={() =>
                      setEditing({ ...editing, all_courses: true })
                    }
                  />
                  {editing.scope === "instructor"
                    ? "ইন্সট্রাক্টরের সব কোর্স"
                    : "সব কোর্স"}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={readOnly}
                    checked={!editing.all_courses}
                    onChange={() =>
                      setEditing({ ...editing, all_courses: false })
                    }
                  />
                  নির্দিষ্ট কোর্স নির্বাচন
                </label>
              </div>
              {!editing.all_courses && (
                <div className="max-h-40 overflow-y-auto rounded border p-2 space-y-1">
                  {courses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      কোনো কোর্স নেই
                    </p>
                  ) : (
                    courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={selectedCourseIds.includes(course.id)}
                          onChange={() =>
                            toggleId(
                              selectedCourseIds,
                              course.id,
                              setSelectedCourseIds,
                            )
                          }
                        />
                        {course.label}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {mode === "admin" && editing.applies_to_books && (
            <div className="space-y-2">
              <Label>বই স্কোপ</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={readOnly}
                    checked={editing.all_books}
                    onChange={() => setEditing({ ...editing, all_books: true })}
                  />
                  সব বই
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={readOnly}
                    checked={!editing.all_books}
                    onChange={() =>
                      setEditing({ ...editing, all_books: false })
                    }
                  />
                  নির্দিষ্ট বই নির্বাচন
                </label>
              </div>
              {!editing.all_books && (
                <div className="max-h-40 overflow-y-auto rounded border p-2 space-y-1">
                  {books.map((book) => (
                    <label
                      key={book.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={selectedBookIds.includes(book.id)}
                        onChange={() =>
                          toggleId(selectedBookIds, book.id, setSelectedBookIds)
                        }
                      />
                      {book.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={editing.is_active}
            disabled={readOnly}
            onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
          />
          <Label>অ্যাক্টিভ</Label>
        </div>

        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <Button onClick={onSave}>সেভ করুন</Button>
            <Button variant="outline" onClick={onCancel}>
              বাতিল
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function emptyCouponForm(
  overrides: Partial<CouponFormState> = {},
): CouponFormState {
  return {
    code: "",
    discount_type: "fixed",
    discount_value: "",
    max_uses: "",
    per_user_limit: "",
    expires_at: "",
    is_active: true,
    scope: "global",
    instructor_id: "",
    applies_to_courses: true,
    applies_to_books: true,
    all_courses: true,
    all_books: true,
    ...overrides,
  };
}

async function couponApi(action: string, payload: Record<string, unknown>) {
  const {
    data: { session },
  } = await (
    await import("@/integrations/supabase/client")
  ).supabase.auth.getSession();
  const res = await fetch("/api/coupon-manage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function saveCouponRequest(
  editing: CouponFormState,
  courseIds: string[],
  bookIds: string[],
) {
  return couponApi("save", { coupon: editing, courseIds, bookIds });
}

export async function approveCouponRequest(couponId: string) {
  return couponApi("approve", { couponId });
}

export async function rejectCouponRequest(
  couponId: string,
  rejectionReason?: string,
) {
  return couponApi("reject", { couponId, rejectionReason });
}

export async function deleteCouponRequest(couponId: string) {
  return couponApi("delete", { couponId });
}
