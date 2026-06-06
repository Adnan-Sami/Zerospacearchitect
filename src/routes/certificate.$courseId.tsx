import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Certificate } from "@/components/Certificate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/certificate/$courseId")({
  component: CertificatePage,
});

function CertificatePage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const certRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }

      // Verify enrollment + 100% completion
      const { data: enroll } = await supabase
        .from("enrollments").select("id").eq("user_id", session.user.id).eq("course_id", courseId).maybeSingle();
      if (!enroll) { navigate({ to: "/my-courses" }); return; }

      const { data: course } = await supabase.from("courses").select("title, certificate_enabled, certificate_title, certificate_body, certificate_signature").eq("id", courseId).single();
      if (course && (course as any).certificate_enabled === false) { toast.error("এই কোর্সের জন্য সার্টিফিকেট উপলব্ধ নয়"); navigate({ to: "/my-courses" }); return; }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", session.user.id).single();

      const { data: modules } = await supabase.from("modules").select("id, lessons(id)").eq("course_id", courseId);
      const allLessons = modules?.flatMap((m: any) => m.lessons?.map((l: any) => l.id) ?? []) ?? [];
      if (allLessons.length === 0) { toast.error("কোর্সে কোনো লেসন নেই"); navigate({ to: "/my-courses" }); return; }

      const { data: progress } = await supabase
        .from("lesson_progress").select("lesson_id").eq("user_id", session.user.id).eq("completed", true).in("lesson_id", allLessons);

      if ((progress?.length ?? 0) < allLessons.length) {
        toast.error("কোর্স সম্পন্ন হয়নি");
        navigate({ to: "/learn/$courseId", params: { courseId } } as any);
        return;
      }

      // Get or create certificate
      let { data: cert } = await supabase
        .from("certificates").select("*").eq("user_id", session.user.id).eq("course_id", courseId).maybeSingle();

      if (!cert) {
        const certNum = `CERT-${Date.now().toString(36).toUpperCase()}`;
        const { data: newCert } = await supabase
          .from("certificates").insert({ user_id: session.user.id, course_id: courseId, certificate_number: certNum }).select().single();
        cert = newCert;
      }

      setData({
        studentName: profile?.full_name || "শিক্ষার্থী",
        courseName: course?.title || "",
        certificateNumber: cert?.certificate_number || "",
        issuedDate: new Date(cert?.issued_at || Date.now()).toLocaleDateString("bn-BD"),
        title: (course as any)?.certificate_title || "",
        body: (course as any)?.certificate_body || "",
        signature: (course as any)?.certificate_signature || "",
      });
      setLoading(false);
    });
  }, [courseId, navigate]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 py-20 text-center text-muted-foreground">লোড হচ্ছে...</div><Footer /></div>;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="print:hidden"><Navbar /></div>
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" />প্রিন্ট/PDF</Button>
        </div>
        <Certificate ref={certRef} {...data} siteName={settings.site_name} />
      </div>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
