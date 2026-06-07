import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(request: Request) {
  try {
    const { action, courseId, payload, instructorId } = await request.json();

    if (action === "create") {
      const { data, error } = await supabaseAdmin
        .from("courses")
        .insert({ ...payload, is_published: false })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Track in instructor_courses
      await supabaseAdmin.from("instructor_courses").insert({
        instructor_id: instructorId,
        course_id: data.id,
        course_title: payload.title,
        course_description: payload.description || "",
        price: payload.price || 0,
        duration_text: payload.duration_text || "",
        thumbnail_url: payload.thumbnail_url || "",
        intro_video_url: payload.intro_video_url || "",
        instructor_name: payload.instructor_name || "",
        instructor_bio: payload.instructor_bio || "",
        instructor_avatar: payload.instructor_avatar || "",
        status: "draft",
      });

      return NextResponse.json({ id: data.id });
    }

    if (action === "update" && courseId) {
      const { error } = await supabaseAdmin
        .from("courses")
        .update({ ...payload, is_published: false })
        .eq("id", courseId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "submit" && courseId) {
      await supabaseAdmin
        .from("instructor_courses")
        .update({ status: "pending" })
        .eq("course_id", courseId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
