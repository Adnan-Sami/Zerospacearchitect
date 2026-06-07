"use client";
import { useEffect, useState } from "react";
import { Download, FileText, Package, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

function printInvoice(order: any) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>Invoice - ${order.invoice_number}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a}
      .box{max-width:700px;margin:auto;border:2px solid #0284c7;border-radius:12px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;padding:24px 30px}
      .hdr h1{font-size:22px;font-weight:800}
      .hdr p{font-size:11px;opacity:.9;margin-top:3px}
      .meta{display:flex;justify-content:space-between;padding:16px 30px;background:#f0f9ff;border-bottom:1px solid #e0f2fe;font-size:13px}
      .body{padding:24px 30px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
      .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
      .val{font-size:13px;font-weight:500;margin-top:2px}
      .item{display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
      .item .name{font-size:15px;font-weight:700}
      .item .price{font-size:20px;font-weight:800;color:#0284c7}
      .total{display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid #e2e8f0;margin-top:14px}
      .total .t-label{font-weight:600}
      .total .t-val{font-size:22px;font-weight:800;color:#0284c7}
      .foot{text-align:center;padding:16px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    </style></head><body>
    <div class="box">
      <div class="hdr"><h1>Zero Space Architect</h1><p>বই অর্ডার ইনভয়েস</p></div>
      <div class="meta"><div><strong>ইনভয়েস:</strong> ${order.invoice_number}</div><div>${new Date(order.created_at).toLocaleDateString("bn-BD")}</div></div>
      <div class="body">
        <div class="grid">
          <div><div class="lbl">গ্রাহক</div><div class="val">${order.customer_name || "—"}<br/>${order.customer_phone || ""}<br/>${order.delivery_address || ""}</div></div>
          <div><div class="lbl">পেমেন্ট</div><div class="val">ট্রানজেকশন: ${order.transaction_id}<br/>ফোন: ${order.payment_phone}</div></div>
        </div>
        <div class="item"><div class="name">${order.books?.title || "বই"}</div><div class="price">৳${Number(order.amount).toLocaleString("bn-BD")}</div></div>
        <div class="total"><div class="t-label">সর্বমোট</div><div class="t-val">৳${Number(order.amount).toLocaleString("bn-BD")}</div></div>
      </div>
      <div class="foot">ধন্যবাদ আপনার অর্ডারের জন্য!</div>
    </div></body></html>
  `);
  win.document.close();
  win.print();
}

export function BookOrdersCard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from("book_orders")
        .select("*, books(title, book_type, pdf_url)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading || orders.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">বই অর্ডারসমূহ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => {
            const isPDF = order.books?.book_type === "pdf";
            const isApproved = order.status === "approved";
            const hasPdfUrl = isPDF && isApproved && order.books?.pdf_url;

            return (
              <div key={order.id} className="rounded-xl border p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isPDF ? "bg-red-50" : "bg-sky-50"}`}>
                      {isPDF ? <FileText className="h-5 w-5 text-red-500" /> : <Package className="h-5 w-5 text-sky-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.books?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isPDF ? "PDF" : "হার্ডকপি"} · ৳{Number(order.amount).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Invoice download */}
                    {order.invoice_number && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => printInvoice(order)}>
                        <Download className="mr-1 h-3 w-3" />ইনভয়েস
                      </Button>
                    )}
                    {/* PDF download */}
                    {hasPdfUrl && (
                      <a href={order.books.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="h-7 rounded-full bg-sky-600 px-3 text-xs hover:bg-sky-700">
                          <Download className="mr-1 h-3 w-3" />PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Tracking for hardcopy */}
                {!isPDF && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1">
                      {/* Step 1: Order Placed */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="mt-1 text-[9px] text-center text-muted-foreground leading-tight w-14">অর্ডার করা হয়েছে</p>
                      </div>
                      <div className={`h-0.5 flex-1 ${order.status === "approved" ? "bg-green-400" : "bg-muted"}`} />

                      {/* Step 2: Approved */}
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${order.status === "approved" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="mt-1 text-[9px] text-center text-muted-foreground leading-tight w-14">অ্যাপ্রুভড</p>
                      </div>
                      <div className={`h-0.5 flex-1 ${order.delivery_status === "dispatched" || order.delivery_status === "delivered" ? "bg-green-400" : "bg-muted"}`} />

                      {/* Step 3: Dispatched */}
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${order.delivery_status === "dispatched" || order.delivery_status === "delivered" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          <Truck className="h-4 w-4" />
                        </div>
                        <p className="mt-1 text-[9px] text-center text-muted-foreground leading-tight w-14">ডিসপ্যাচড</p>
                      </div>
                      <div className={`h-0.5 flex-1 ${order.delivery_status === "delivered" ? "bg-green-400" : "bg-muted"}`} />

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${order.delivery_status === "delivered" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          <Package className="h-4 w-4" />
                        </div>
                        <p className="mt-1 text-[9px] text-center text-muted-foreground leading-tight w-14">ডেলিভার্ড</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF status */}
                {isPDF && (
                  <div className="mt-3">
                    {order.status === "pending" && (
                      <Badge className="bg-yellow-100 text-yellow-800">⏳ পেন্ডিং</Badge>
                    )}
                    {isApproved && hasPdfUrl && (
                      <Badge className="bg-green-100 text-green-800">✅ ডাউনলোড রেডি</Badge>
                    )}
                    {isApproved && !order.books?.pdf_url && (
                      <Badge className="bg-green-100 text-green-800">✅ অ্যাপ্রুভড</Badge>
                    )}
                    {order.status === "rejected" && (
                      <Badge variant="destructive">রিজেক্টেড</Badge>
                    )}
                  </div>
                )}

                {/* Rejected message */}
                {order.status === "rejected" && (
                  <p className="mt-2 text-xs text-red-600">❌ এই অর্ডার রিজেক্ট করা হয়েছে।</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
