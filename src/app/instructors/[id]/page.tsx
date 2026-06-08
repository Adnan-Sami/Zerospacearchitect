"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Facebook, Youtube, BookOpen, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type Instructor = {
  id: string;
  name: string;
  title: string;
  designation: string;
  bio: string;
  image_url: string;
  facebook_url: string | null;
  youtube_url: string | null;
  total_courses: number;
  total_students: number;
};

type Course = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price: number;
  original_price: number | null;
  enrollment_count: number | null;
};

export default function InstructorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      // Fetch instructor
      const { data: inst } = await supabase
        .from("public_instructors")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (!inst) {
        setLoading(false);
        return;
      }
      setInstructor(inst as Instructor);

      // Fetch assigned courses from junction table
      const { data: assigned } = await supabase
        .from("instructor_assigned_courses")
        .select("course_id")
        .eq("instructor_id", id);

      if (assigned && assigned.length > 0) {
        const courseIds = assigned.map((a: any) => a.course_id);
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, thumbnail_url, price, original_price, enrollment_count")
          .in("id", courseIds)
          .eq("is_published", true);
        setCourses((coursesData as Course[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-xl font-bold text-muted-foreground">প্রশিক্ষক খুঁজে পাওয়া যায়নি</p>
          <Link href="/instructors">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />সকল প্রশিক্ষক</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-4 py-12 text-white md:py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <Link href="/instructors" className="mb-6 inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />সকল প্রশিক্ষক
          </Link>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h1 className="mb-2 text-3xl font-black md:text-4xl lg:text-5xl">{instructor.name}</h1>
              {instructor.title && <p className="mb-1 text-sm text-white/70">{instructor.title}</p>}
              {instructor.designation && <p className="mb-5 text-sm text-white/60">{instructor.designation}</p>}

              {/* Social */}
              <div className="mb-5 flex items-center gap-3">
                {instructor.facebook_url && (
                  <a href={instructor.facebook_url} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-transform hover:scale-110">
                    <Facebook className="h-4 w-4 fill-current" />
                  </a>
                )}
                {instructor.youtube_url && (
                  <a href={instructor.youtube_url} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110">
                    <Youtube className="h-4 w-4 fill-current" />
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-5 text-sm">
                {instructor.total_courses > 0 && (
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <BookOpen className="h-4 w-4 text-sky-400" />{instructor.total_courses} courses
                  </span>
                )}
                {instructor.total_students > 0 && (
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Users className="h-4 w-4 text-sky-400" />{instructor.total_students.toLocaleString()} students
                  </span>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="hidden md:block">
              {instructor.image_url ? (
                <Image
                  src={instructor.image_url}
                  alt={instructor.name}
                  width={280}
                  height={280}
                  className="h-48 w-48 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10 lg:h-64 lg:w-64"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-sky-800 text-5xl font-bold text-white/30 lg:h-64 lg:w-64 lg:text-6xl">
                  {instructor.name?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      {instructor.bio && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 rounded-2xl border bg-slate-50 p-4 sm:flex-row sm:gap-5 sm:p-6">
            {instructor.image_url && (
              <Image
                src={instructor.image_url}
                alt={instructor.name}
                width={80}
                height={80}
                className="h-16 w-16 shrink-0 self-center rounded-full object-cover shadow-md sm:self-start"
              />
            )}
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 md:text-base">
              {instructor.bio}
            </p>
          </div>
        </section>
      )}

      {/* Courses Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {courses.length > 0 && (
          <div>
            <h2 className="mb-6 text-center text-2xl font-black text-gray-900">All Courses:</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      {(course.enrollment_count ?? 0) > 0 && (
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                          {course.enrollment_count} জন+
                        </span>
                      )}
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                        {course.price > 0 ? `৳ ${course.price}` : "ফ্রি"}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {courses.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">এই প্রশিক্ষকের কোনো কোর্স এখনও অ্যাসাইন করা হয়নি।</p>
        )}
      </section>

      <Footer />
    </div>
  );
}
