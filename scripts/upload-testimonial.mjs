import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadTestimonial(videoPath, testimonialData) {
  try {
    // Read video file
    if (!fs.existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(videoPath);
    const fileName = path.basename(videoPath);
    const storagePath = `${Date.now()}-${fileName}`;

    console.log(`Uploading video: ${fileName}`);

    // Upload video to testimonials-videos bucket
    const { error: uploadError } = await supabase.storage
      .from("testimonials-videos")
      .upload(storagePath, fileBuffer, {
        contentType: "video/mp4",
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      process.exit(1);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("testimonials-videos")
      .getPublicUrl(storagePath);

    console.log(`Video uploaded successfully: ${publicUrl.publicUrl}`);

    // Insert testimonial record
    const { data, error: insertError } = await supabase
      .from("testimonials")
      .insert([
        {
          ...testimonialData,
          video_url: publicUrl.publicUrl,
          order_index: Math.floor(Date.now() / 1000),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert testimonial:", insertError);
      process.exit(1);
    }

    console.log("Testimonial created:", data);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Example usage
const videoPath = "C:\\Users\\sande\\Downloads\\WhatsApp Video 2026-07-29 at 5.51.32 PM.mp4";
const testimonialData = {
  user_name: "Sarah Johnson",
  user_title: "Entrepreneur & Mentor",
  rating: 5,
  message: "Connectiqo has been amazing for connecting with mentors. The platform is user-friendly and the mentors are incredibly knowledgeable!",
  user_avatar_url: null,
};

uploadTestimonial(videoPath, testimonialData);
