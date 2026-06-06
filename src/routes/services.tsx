import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Building2, Compass, Hammer, PenTool, Ruler, TreePine, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/use-site-content";
import { toast } from "sonner";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "ডিজাইন অ্যান্ড কনসালটেন্ট সেবা সমূহ - ZeroSpace Architect" },
      { name: "description", content: "আর্কিটেকচারাল ডিজাইন, ইন্টেরিয়র এবং স্ট্রাকচারাল কনসালটেন্সি সেবা।" },
    ],
  }),
  component: ServicesPage,
});

const SERVICE_ICONS = [Building2, PenTool, Ruler, Compass, TreePine, Hammer];

function ServicesPage() {
  const heroTitle = useSiteContent("services.hero.title");
  const heroSubtitle = useSiteContent("services.hero.subtitle");
  const listTitle = useSiteContent("services.list.title");
  const s1t = useSiteContent("services.1.title"); const s1d = useSiteContent("services.1.desc");
  const s2t = useSiteContent("services.2.title"); const s2d = useSiteContent("services.2.desc");
  const s3t = useSiteContent("services.3.title"); const s3d = useSiteContent("services.3.desc");
  const s4t = useSiteContent("services.4.title"); const s4d = useSiteContent("services.4.desc");
  const s5t = useSiteContent("services.5.title"); const s5d = useSiteContent("services.5.desc");
  const s6t = useSiteContent("services.6.title"); const s6d = useSiteContent("services.6.desc");
  const whyTitle = useSiteContent("services.why.title");
  const why1 = useSiteContent("services.why.1");
  const why2 = useSiteContent("services.why.2");
  const why3 = useSiteContent("services.why.3");
  const why4 = useSiteContent("services.why.4");
  const formTitle = useSiteContent("services.form.title");
  const formSubtitle = useSiteContent("services.form.subtitle");
  const formSubmit = useSiteContent("services.form.submit");

  const services = [
    { title: s1t, desc: s1d }, { title: s2t, desc: s2d }, { title: s3t, desc: s3d },
    { title: s4t, desc: s4d }, { title: s5t, desc: s5d }, { title: s6t, desc: s6d },
  ];

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", service_type: "", project_location: "", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("service_requests").insert([form]);
    setLoading(false);
    if (error) {
      toast.error("রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } else {
      toast.success("আপনার রেজিস্ট্রেশন সফল হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setForm({ full_name: "", email: "", phone: "", service_type: "", project_location: "", message: "" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">{heroTitle}</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{listTitle}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => {
              const Icon = SERVICE_ICONS[i];
              return (
                <Card key={i} className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{whyTitle}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[why1, why2, why3, why4].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-card p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className="py-14">
        <div className="mx-auto max-w-2xl px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{formTitle}</CardTitle>
              <CardDescription>{formSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">পুরো নাম *</Label>
                    <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">ফোন নম্বর *</Label>
                    <Input id="phone" required placeholder="০১XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_type">সেবার ধরন *</Label>
                  <select
                    id="service_type"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.service_type}
                    onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  >
                    <option value="">— নির্বাচন করুন —</option>
                    {services.map((s) => (
                      <option key={s.title} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_location">প্রজেক্টের অবস্থান</Label>
                  <Input id="project_location" value={form.project_location} onChange={(e) => setForm({ ...form, project_location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">প্রজেক্ট সম্পর্কে বিস্তারিত</Label>
                  <Textarea id="message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "অপেক্ষা করুন..." : formSubmit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
