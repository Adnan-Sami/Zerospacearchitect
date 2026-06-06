import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/p/$slug")({
  component: CustomPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">পেজ পাওয়া যায়নি</h1>
      <Link to="/" className="text-primary underline">হোমে ফিরুন</Link>
    </div>
  ),
});

function CustomPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("custom_pages").select("*").eq("slug", slug).eq("is_published", true).maybeSingle().then(({ data }) => {
      setPage(data); setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">লোড হচ্ছে...</div>;
  if (!page) throw notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
        <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </main>
      <Footer />
    </div>
  );
}
