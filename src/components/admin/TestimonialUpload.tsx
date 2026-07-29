"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { testimonialApi } from "@/lib/api/testimonialApi";
import { createClient } from "@/lib/supabase/client";

interface TestimonialUploadProps {
  onSuccess?: () => void;
}

export function TestimonialUpload({ onSuccess }: TestimonialUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    userName: "",
    userTitle: "",
    rating: 5,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedVideo) {
      setError("Please select a video file");
      return;
    }

    if (!formData.userName.trim()) {
      setError("Please enter user name");
      return;
    }

    try {
      setLoading(true);
      const client = createClient();

      // Upload video
      const videoUrl = await testimonialApi.uploadVideo(
        client,
        selectedVideo,
        selectedVideo.name
      );

      // Upload thumbnail if provided
      let thumbnailUrl = undefined;
      if (selectedThumbnail) {
        thumbnailUrl = await testimonialApi.uploadThumbnail(
          client,
          selectedThumbnail,
          selectedThumbnail.name
        );
      }

      // Add testimonial to database
      await testimonialApi.addTestimonial(client, {
        user_name: formData.userName,
        user_title: formData.userTitle || undefined,
        rating: formData.rating,
        message: formData.message || undefined,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        order_index: Math.floor(Date.now() / 1000),
      });

      // Reset form
      setFormData({
        userName: "",
        userTitle: "",
        rating: 5,
        message: "",
      });
      setSelectedVideo(null);
      setSelectedThumbnail(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload testimonial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border-light bg-surface-panel p-6">
      <h3 className="mb-4 font-semibold text-text-primary">Add Testimonial</h3>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            User Name *
          </label>
          <input
            type="text"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            className="w-full rounded-lg border border-border-light bg-surface-page px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-link focus:outline-none"
            placeholder="e.g., Sarah Johnson"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            User Title
          </label>
          <input
            type="text"
            value={formData.userTitle}
            onChange={(e) => setFormData({ ...formData, userTitle: e.target.value })}
            className="w-full rounded-lg border border-border-light bg-surface-page px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-link focus:outline-none"
            placeholder="e.g., Entrepreneur, Software Developer"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full rounded-lg border border-border-light bg-surface-page px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-link focus:outline-none"
            placeholder="What did you love about Connectiqo?"
            rows={3}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Rating (1-5 stars) *
          </label>
          <select
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-border-light bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-accent-link focus:outline-none"
            disabled={loading}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} Star{n !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Video File *
          </label>
          <div className="relative">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-light bg-surface-page px-4 py-6 text-sm font-medium text-text-secondary transition-colors hover:border-accent-link/40 hover:text-text-primary disabled:opacity-50"
              disabled={loading}
            >
              <Upload size={18} />
              {selectedVideo ? selectedVideo.name : "Choose video file"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Thumbnail (optional)
          </label>
          <div className="relative">
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-light bg-surface-page px-4 py-6 text-sm font-medium text-text-secondary transition-colors hover:border-accent-link/40 hover:text-text-primary disabled:opacity-50"
              disabled={loading}
            >
              <Upload size={18} />
              {selectedThumbnail ? selectedThumbnail.name : "Choose thumbnail image"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent-link px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Testimonial"}
        </button>
      </form>
    </div>
  );
}
