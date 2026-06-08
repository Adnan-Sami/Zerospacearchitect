"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Certificate } from "@/components/Certificate";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function VerifyPage() {
  const settings = useSiteSettings();
  const [certNumber, setCertNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNumber.trim()) return;
    setLoading(true);
    setResult(null);
    setSearched(true);

    const { data: cert } = await supabase
      .from("certificates")
      .select("*, courses(title, certificate_title, certificate_body, certificate_signature)")
      .eq("certificate_number", certNumber.trim().toUpperCase())
      .maybeSingle();

    if (cert) {
      // Get student name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", cert.user_id)
        .single();

      setResult({
        valid: true,
        studentName: profile?.full_name || "শিক্ষার্থী",
        courseName: cert.courses?.title || "",
        certificateNumber: cert.certificate_number,
        issuedDate: new Date(cert.issued_at).toLocaleDateString("bn-BD"),
        title: cert.courses?.certificate_title,
        body: cert.courses?.certificate_body,
        signature: cert.courses?.certificate_signature,
      });
    } else {
      setResult({ valid: false });
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        {/* Hero */}
        <section className="bg-[#f0f7ff] py-12">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <Award className="h-8 w-8 text-sky-600" />
            </div>
            <h1 className="mb-2 text-3xl font-black text-foreground">সার্টিফিকেট যাচাই করুন</h1>
            <p className="text-muted-foreground">সার্টিফিকেট নম্বর দিয়ে যাচাই করুন এটি বৈধ কি না</p>
          </div>
        </section>

        {/* Search form */}
        <section className="mx-auto max-w-xl px-4 -mt-6">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleVerify} className="flex gap-2">
                <Input
                  placeholder="সার্টিফিকেট নম্বর লিখুন (যেমন: CERT-XXXXXX)"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="text-sm"
                  required
                />
                <Button type="submit" disabled={loading} className="shrink-0">
                  <Search className="mr-1 h-4 w-4" />
                  {loading ? "..." : "যাচাই"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Result */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          {searched && result && (
            <>
              {result.valid ? (
                <div className="space-y-6">
                  {/* Valid badge */}
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800">✓ সার্টিফিকেট বৈধ</p>
                      <p className="text-sm text-green-700">
                        এই সার্টিফিকেটটি {settings.site_name || "Zero Space Architect"} কর্তৃক ইস্যু করা হয়েছে।
                      </p>
                    </div>
                  </div>

                  {/* Certificate preview */}
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    <Certificate
                      studentName={result.studentName}
                      courseName={result.courseName}
                      certificateNumber={result.certificateNumber}
                      issuedDate={result.issuedDate}
                      siteName={settings.site_name || "Zero Space Architect"}
                      title={result.title}
                      body={result.body}
                      signature={result.signature}
                    />
                  </div>

                  {/* Details */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="mb-3 font-semibold">সার্টিফিকেট তথ্য</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                          <span className="text-muted-foreground">শিক্ষার্থীর নাম</span>
                          <span className="font-medium">{result.studentName}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                          <span className="text-muted-foreground">কোর্স</span>
                          <span className="font-medium text-right sm:max-w-[60%]">{result.courseName}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                          <span className="text-muted-foreground">সার্টিফিকেট নং</span>
                          <span className="font-mono font-medium">{result.certificateNumber}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                          <span className="text-muted-foreground">ইস্যু তারিখ</span>
                          <span className="font-medium">{result.issuedDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-bold text-red-800">✗ সার্টিফিকেট পাওয়া যায়নি</p>
                    <p className="text-sm text-red-700">
                      এই নম্বরের কোনো সার্টিফিকেট আমাদের সিস্টেমে নেই। সঠিক নম্বর দিয়ে আবার চেষ্টা করুন।
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {!searched && (
            <div className="py-12 text-center text-muted-foreground">
              <Award className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">সার্টিফিকেট নম্বর দিয়ে সার্চ করুন</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
