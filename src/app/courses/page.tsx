"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/use-site-content";

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">লোড হচ্ছে...</div>}>
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const searchParams = useSearchParams();
  const pageTitle = useSiteContent("courses.title");
  const searchPlaceholder = useSiteContent("courses.search.placeholder");
  const allLabel = useSiteContent("courses.all");
  const emptyMsg = useSiteContent("courses.empty");
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Read search param from URL (from navbar search)
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("*, categories(name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (selectedCategory) query = query.eq("category_id", selectedCategory);
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,instructor_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    query.then(({ data }) => {
      if (data) setCourses(data);
      setLoading(false);
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{pageTitle || "সকল কোর্স"}</h1>

        {/* Filter Section */}
        <div className="mb-6 space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || "কোর্স খুঁজুন..."}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              className={selectedCategory === "" ? "bg-sky-600 hover:bg-sky-700" : ""}
              onClick={() => setSelectedCategory("")}
            >
              {allLabel || "সব"}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className={selectedCategory === cat.id ? "bg-sky-600 hover:bg-sky-700" : ""}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {!selectedCategory && !searchTerm && (
          <p className="mb-4 text-sm text-muted-foreground">{courses.length} টি কোর্স পাওয়া গেছে</p>
        )}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            লোড হচ্ছে...
          </div>
        ) : courses.length > 0 ? (
          <>
            {/* When a category is selected or searching — flat grid */}
            {(selectedCategory || searchTerm) ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{courses.length} টি কোর্স পাওয়া গেছে</p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      thumbnailUrl={course.thumbnail_url}
                      price={Number(course.price)}
                      instructorName={course.instructor_name}
                      categoryName={course.categories?.name}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* When "সব" — grouped by category */
              <div className="space-y-10">
                {/* Courses with categories */}
                {categories.filter(cat => courses.some(c => c.category_id === cat.id)).map((cat) => {
                  const catCourses = courses.filter(c => c.category_id === cat.id);
                  return (
                    <div key={cat.id}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">{cat.name}</h2>
                        <button
                          onClick={() => setSelectedCategory(cat.id)}
                          className="text-sm font-medium text-sky-600 hover:underline"
                        >
                          সব দেখুন ({catCourses.length})
                        </button>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {catCourses.slice(0, 3).map((course) => (
                          <CourseCard
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            thumbnailUrl={course.thumbnail_url}
                            price={Number(course.price)}
                            instructorName={course.instructor_name}
                            categoryName={course.categories?.name}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Uncategorized courses */}
                {courses.filter(c => !c.category_id).length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-foreground">অন্যান্য কোর্স</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {courses.filter(c => !c.category_id).map((course) => (
                        <CourseCard
                          key={course.id}
                          id={course.id}
                          title={course.title}
                          thumbnailUrl={course.thumbnail_url}
                          price={Number(course.price)}
                          instructorName={course.instructor_name}
                          categoryName={course.categories?.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">{emptyMsg}</div>
        )}
      </div>
      <Footer />
    </div>
  );
}
