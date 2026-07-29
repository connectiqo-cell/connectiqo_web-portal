import type { SupabaseClient } from "@supabase/supabase-js";

export interface Testimonial {
  id: string;
  user_name: string;
  user_title?: string;
  user_avatar_url?: string;
  video_url: string;
  thumbnail_url?: string;
  rating: number;
  message?: string;
  created_at: string;
  order_index: number;
}

export const testimonialApi = {
  async getTestimonials(client: SupabaseClient) {
    try {
      const { data, error } = await client
        .from("testimonials")
        .select("*")
        .order("order_index", { ascending: true })
        .limit(10);

      if (error) {
        // Silently handle missing table error (migration not applied yet)
        if (error.message?.includes("does not exist") || error.code === "PGRST116") {
          console.info("Testimonials table not yet created. Run migration first.");
          return [];
        }
        console.error("Failed to fetch testimonials:", error);
        return [];
      }

      return (data || []) as Testimonial[];
    } catch (err) {
      console.error("Unexpected error fetching testimonials:", err);
      return [];
    }
  },

  async addTestimonial(
    client: SupabaseClient,
    testimonial: Omit<Testimonial, "id" | "created_at">
  ) {
    const { data, error } = await client.from("testimonials").insert([testimonial]).select().single();

    if (error) {
      console.error("Failed to add testimonial:", error);
      throw error;
    }

    return data as Testimonial;
  },

  async uploadVideo(
    client: SupabaseClient,
    file: File,
    fileName: string
  ): Promise<string> {
    const bucket = "testimonials-videos";
    const path = `${Date.now()}-${fileName}`;

    const { error: uploadError } = await client.storage.from(bucket).upload(path, file);

    if (uploadError) {
      console.error("Failed to upload video:", uploadError);
      throw uploadError;
    }

    const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(path);

    return publicUrl.publicUrl;
  },

  async uploadThumbnail(
    client: SupabaseClient,
    file: File,
    fileName: string
  ): Promise<string> {
    const bucket = "testimonials-thumbnails";
    const path = `${Date.now()}-${fileName}`;

    const { error: uploadError } = await client.storage.from(bucket).upload(path, file);

    if (uploadError) {
      console.error("Failed to upload thumbnail:", uploadError);
      throw uploadError;
    }

    const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(path);

    return publicUrl.publicUrl;
  },
};
