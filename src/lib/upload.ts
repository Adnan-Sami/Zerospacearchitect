import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Cloudinary (primary) with Supabase Storage fallback.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  options?: {
    folder?: string;
    /** Supabase bucket name for fallback */
    bucket?: string;
    /** Supabase storage path for fallback */
    path?: string;
  }
): Promise<string> {
  const folder = options?.folder || "zerospace";

  // Try Cloudinary first
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (err) {
    console.warn("Cloudinary upload failed, falling back to Supabase:", err);
  }

  // Fallback to Supabase Storage
  const bucket = options?.bucket || "course-thumbnails";
  const ext = file.name.split(".").pop();
  const path =
    options?.path || `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
