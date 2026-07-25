"use client";

import { Trash2, Upload, Video as VideoIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { videoLibraryApi, type MentorVideo } from "@/lib/api/videoLibraryApi";
import { VIDEO_UNLOCK_PRICE_TIERS } from "@/lib/constants/videoUnlockTiers";

export default function MentorVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<MentorVideo[]>([]);
  const [unlockPrice, setUnlockPriceState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadVideos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rows, profile] = await Promise.all([
        videoLibraryApi.getMentorVideos(user.id),
        profileApi.getMentorProfile(user.id),
      ]);
      
      setVideos(rows);
      setUnlockPriceState(profile.unlock_price ?? null);
    } catch (err) {
      setError((err as Error)?.message || "Could not load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadVideos());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePriceChange = async (price: number) => {
    if (!user) return;
    setUnlockPriceState(price);
    try {
      await videoLibraryApi.setUnlockPrice({ mentorId: user.id, price });
    } catch (err) {
      setError((err as Error)?.message || "Could not update unlock price");
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return;
    setUploading(true);
    setError("");
    try {
      await videoLibraryApi.uploadVideo({
        mentorId: user.id,
        title: title.trim(),
        description: description.trim(),
        file,
        isFree,
        thumbnailFile: thumbnailFile || undefined,
      });
      setTitle("");
      setDescription("");
      setIsFree(false);
      setFile(null);
      setThumbnailFile(null);
      await loadVideos();
    } catch (err) {
      setError((err as Error)?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: MentorVideo) => {
    try {
      await videoLibraryApi.deleteVideo({ id: video.id, storagePath: video.storage_path });
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err) {
      setError((err as Error)?.message || "Could not delete video");
    }
  };
  

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">Video library unlock price</h2>
        <p className="text-xs text-text-muted">
          Learners pay this once for 30 days of access to all your non-free videos.
        </p>
        <div className="flex flex-wrap gap-2">
          {VIDEO_UNLOCK_PRICE_TIERS.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => handlePriceChange(price)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                unlockPrice === price
                  ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                  : "border-border-light text-text-secondary hover:text-text-primary"
              }`}
            >
              ₹{price}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">Upload a video</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Free preview (visible without unlocking)
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Video file
          </span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-text-secondary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Thumbnail (optional)
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            className="text-sm text-text-secondary"
          />
        </label>

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !title.trim()}
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <Upload size={16} />
          {uploading ? "Uploading…" : "Upload video"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Your videos ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No videos uploaded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-chip">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                    <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" />
                  ) : (
                    <VideoIcon size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{video.title}</p>
                  <p className="text-xs text-text-muted">{video.is_free ? "Free preview" : "Locked"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(video)}
                  aria-label="Delete video"
                  className="text-text-muted hover:text-accent-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
