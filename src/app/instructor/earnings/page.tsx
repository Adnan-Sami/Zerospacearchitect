"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function InstructorEarnings() {
  const [courses, setCourses] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      
      const res = await fetch("/api/instructor-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId: session.user.id }),
      });
      const data = await res.json();
      setCourses(data.courses ?? []);
      setTotalEarnings(data.total ?? 0);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">আয়ের বিবরণ</h1>

      <Card className="mb-6 border-purple-200 bg-purple-50">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <DollarSign className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-purple-700">মোট আনুমানিক আয় (৪০% কমিশন)</p>
            <p className="text-3xl font-black text-purple-800">৳{totalEarnings.toLocaleString("bn-BD")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">কোর্সওয়ারি আয়</CardTitle></CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো অ্যাপ্রুভড কোর্স নেই।</p>
          ) : (
            <div className="space-y-3">
              {courses.map((c: any) => (
                <div key={c.course_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{c.course_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.sales} সেল · মোট ৳{c.revenue.toLocaleString()} × ৪০%
                    </p>
                  </div>
                  <p className="font-bold text-purple-600">৳{c.commission.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
