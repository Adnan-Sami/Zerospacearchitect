"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toBn } from "@/lib/utils";

export default function InstructorEarnings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [commissionPct, setCommissionPct] = useState(40);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const [settingsRes, earningsRes] = await Promise.all([
        supabase.from("site_settings").select("commission_percentage").limit(1).maybeSingle(),
        fetch("/api/instructor-monthly-earnings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instructorId: session.user.id }),
        }),
      ]);
      setCommissionPct(Number(settingsRes.data?.commission_percentage) || 40);
      const result = await earningsRes.json();
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="py-20 text-center text-muted-foreground">লোড হচ্ছে...</p>;

  const { months = [], totalEarned = 0, totalPaid = 0, balance = 0, payments = [] } = data || {};

  const filteredMonths = monthFilter === "all" ? months : months.filter((m: any) => m.month === monthFilter);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">আয়ের বিবরণ</h1>

      {/* Payment schedule note */}
      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-semibold text-sky-800">💰 পেমেন্ট শিডিউল</p>
        <p className="mt-1 text-xs text-sky-700">প্রতি মাসের <strong>৫ তারিখে</strong> আপনার পূর্ববর্তী মাসের কমিশন বিকাশ/নগদে পাঠানো হবে। কোনো সমস্যা থাকলে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      </div>

      {/* Payment method */}
      <PaymentMethodCard />

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-5">
            <p className="text-xs text-purple-700">মোট আয় ({toBn(commissionPct)}%)</p>
            <p className="mt-1 text-2xl font-black text-purple-800 tabular-nums">৳{toBn(totalEarned.toLocaleString())}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5">
            <p className="text-xs text-green-700">মোট প্রাপ্ত</p>
            <p className="mt-1 text-2xl font-black text-green-800 tabular-nums">৳{toBn(totalPaid.toLocaleString())}</p>
          </CardContent>
        </Card>
        <Card className={`${balance > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
          <CardContent className="p-5">
            <p className={`text-xs ${balance > 0 ? "text-amber-700" : "text-green-700"}`}>বকেয়া</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${balance > 0 ? "text-amber-800" : "text-green-800"}`}>৳{toBn(balance.toLocaleString())}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">মাসওয়ারি আয় ও পেমেন্ট</CardTitle>
            <div className="flex items-center gap-2">
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
                <option value="all">সব মাস</option>
                {months.map((m: any) => <option key={m.month} value={m.month}>{m.month}</option>)}
              </select>
              {filteredMonths.length > 0 && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                  const headers = ["মাস", "আয়", "প্রাপ্ত", "বকেয়া", "স্ট্যাটাস"];
                  const rows = filteredMonths.map((m: any) => [m.month, m.earned, m.paid, m.due, m.due <= 0 ? "পেইড" : "বকেয়া"]);
                  const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
                  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `earnings-${monthFilter}.csv`;
                  link.click();
                }}>
                  <DollarSign className="mr-1 h-3 w-3" />CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMonths.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো আয় নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold">মাস</th>
                    <th className="px-3 py-2 text-right font-semibold">আয়</th>
                    <th className="px-3 py-2 text-right font-semibold">প্রাপ্ত</th>
                    <th className="px-3 py-2 text-right font-semibold">বকেয়া</th>
                    <th className="px-3 py-2 text-right font-semibold">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMonths.map((m: any) => (
                    <tr key={m.month} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-medium">{m.month}</td>
                      <td className="px-3 py-2.5 text-right text-purple-600 font-semibold tabular-nums">৳{toBn(m.earned.toLocaleString())}</td>
                      <td className="px-3 py-2.5 text-right text-green-600 tabular-nums">৳{toBn(m.paid.toLocaleString())}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{m.due > 0 ? `৳${toBn(m.due.toLocaleString())}` : "—"}</td>
                      <td className="px-3 py-2.5 text-right">
                        {m.due <= 0 ? (
                          <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />পেইড</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800"><Clock className="mr-1 h-3 w-3" />বকেয়া</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      {payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">পেমেন্ট হিস্ট্রি</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-green-800">৳{Number(p.amount).toLocaleString()} প্রাপ্ত</p>
                    <p className="text-xs text-muted-foreground">{p.month} · {new Date(p.paid_at).toLocaleDateString("bn-BD")}</p>
                    {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                  </div>
                  <Badge className="bg-green-100 text-green-800">✓</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function PaymentMethodCard() {
  const [method, setMethod] = useState("");
  const [number, setNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from("profiles").select("payment_method, payment_number, bank_name, bank_account_name, bank_branch").eq("user_id", session.user.id).single();
      if (data) {
        setMethod(data.payment_method || "");
        setNumber(data.payment_number || "");
        setBankName(data.bank_name || "");
        setAccountName(data.bank_account_name || "");
        setBranchName(data.bank_branch || "");
      }
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("profiles").update({
      payment_method: method,
      payment_number: number,
      bank_name: method === "bank" ? bankName : "",
      bank_account_name: method === "bank" ? accountName : "",
      bank_branch: method === "bank" ? branchName : "",
    }).eq("user_id", session.user.id);
    toast.success("পেমেন্ট তথ্য সেভ হয়েছে");
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <Card className="mb-6 border-green-200">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold text-green-700">💳 পেমেন্ট মেথড</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground">আপনার পেমেন্ট গ্রহণের মাধ্যম আপডেট করুন। অ্যাডমিন এই তথ্য দেখে পেমেন্ট পাঠাবেন।</p>
        
        {method && number && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-700">
              <span className="font-semibold">সেভ আছে:</span>{" "}
              {method === "bank" ? `🏦 ${bankName} · ${accountName} · ${number}` : `💳 ${method === "bkash" ? "বিকাশ" : method === "nagad" ? "নগদ" : "রকেট"}: ${number}`}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium">পেমেন্ট মাধ্যম</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">— নির্বাচন করুন —</option>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
            <option value="bank">ব্যাংক ট্রান্সফার</option>
          </select>
        </div>

        {method && method !== "bank" && (
          <div>
            <label className="text-xs font-medium">{method === "bkash" ? "বিকাশ" : method === "nagad" ? "নগদ" : "রকেট"} নম্বর</label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="০১XXXXXXXXX" className="mt-1" />
          </div>
        )}

        {method === "bank" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <label className="text-xs font-medium">ব্যাংকের নাম</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="যেমন: Dutch-Bangla Bank" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">অ্যাকাউন্ট নাম</label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="অ্যাকাউন্ট হোল্ডারের নাম" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">অ্যাকাউন্ট নম্বর</label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="অ্যাকাউন্ট নম্বর" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">ব্রাঞ্চ</label>
              <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="ব্রাঞ্চের নাম" className="mt-1" />
            </div>
          </div>
        )}

        <Button size="sm" onClick={save} disabled={saving || !method} className="bg-green-600 hover:bg-green-700">
          {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
        </Button>
      </CardContent>
    </Card>
  );
}
