"use client";

import { FileVideo, ImageIcon, Pencil, Play, Trash2, Upload, Video as VideoIcon, X } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { videoLibraryApi, type MentorVideo } from "@/lib/api/videoLibraryApi";
import { VIDEO_UNLOCK_PRICE_TIERS } from "@/lib/constants/videoUnlockTiers";
import { ROUTES } from "@/lib/routes";
import { captureVideoFrame } from "@/lib/utils/videoThumbnail";

const MAX_VIDEO_MB = 80;
const PAGE_SIZE = 15;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PlayerModal({ video, onClose }: { video: MentorVideo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="flex w-full max-w-2xl flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-semibold text-white">{video.title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <video src={video.video_url} controls autoPlay className="max-h-[75vh] w-full rounded-xl bg-black" />
      </div>
    </div>
  );
}

function EditModal({
  video,
  onClose,
  onSaved,
}: {
  video: MentorVideo;
  onClose: () => void;
  onSaved: (v: MentorVideo) => void;
}) {
  
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || "");
  const [isFree, setIsFree] = useState(video.is_free);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await videoLibraryApi.updateVideo({
        id: video.id,
        title: title.trim(),
        description: description.trim(),
        isFree,
      });
      onSaved({ ...video, ...updated } as MentorVideo);
      onClose();
    } catch (err) {
      setError((err as Error)?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Edit video</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Description (optional)"
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Free preview (visible without unlocking)
        </label>

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-full border border-border-light px-4 py-2 text-sm font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MentorVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<MentorVideo[]>([]);
  const [unlockPrice, setUnlockPriceState] = useState<number | null>(null);
  const [hasMentorProfile, setHasMentorProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [playingVideo, setPlayingVideo] = useState<MentorVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<MentorVideo | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadVideos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetched independently: a mentor who hasn't filled in their
      // mentor_profiles row yet (unlock price, bio, etc.) should still be
      // able to see and upload videos — mentor_videos only has a FK to
      // profiles, not mentor_profiles. Bundling these via Promise.all meant
      // a missing mentor_profiles row (.single() throws on zero rows) wiped
      // out the entire page, including videos that loaded fine.
      const rows = await videoLibraryApi.getMentorVideos(user.id);
      setVideos(rows);
      try {
        const profile = await profileApi.getMentorProfile(user.id);
        setUnlockPriceState(profile.unlock_price ?? null);
        setHasMentorProfile(true);
      } catch {
        setUnlockPriceState(null);
        setHasMentorProfile(false);
      }
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
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_VIDEO_MB} MB`);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError("");
    try {
      const thumbnailToUpload = thumbnailFile || (await captureVideoFrame(file).catch(() => null));
      const uploaded = await videoLibraryApi.uploadVideo({
        mentorId: user.id,
        title: title.trim(),
        description: description.trim(),
        file,
        isFree,
        thumbnailFile: thumbnailToUpload || undefined,
        onProgress: setUploadProgress,
      });
      setVideos((prev) => [uploaded, ...prev]);
      setTitle("");
      setDescription("");
      setIsFree(false);
      setFile(null);
      setThumbnailFile(null);
    } catch (err) {
      setError((err as Error)?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  const handleToggleFree = async (video: MentorVideo) => {
    const nextFree = !video.is_free;
    setTogglingId(video.id);
    try {
      await videoLibraryApi.updateVideo({ id: video.id, isFree: nextFree });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, is_free: nextFree } : v)));
    } catch (err) {
      setError((err as Error)?.message || "Could not update video");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">Video library unlock price</h2>
        {!hasMentorProfile ? (
          <p className="rounded-xl border border-accent-warning/30 bg-accent-warning/10 px-3.5 py-2.5 text-xs text-text-secondary">
            You haven&apos;t set up your mentor profile yet, so an unlock price can&apos;t be saved.{" "}
            <Link href={ROUTES.mentorProfileDashboard} className="font-semibold text-accent-link">
              Complete your mentor profile
            </Link>{" "}
            first — you can still upload videos below in the meantime.
          </p>
        ) : (
          <p className="text-xs text-text-muted">
            Learners pay this once for 30 days of access to all your non-free videos.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {VIDEO_UNLOCK_PRICE_TIERS.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => handlePriceChange(price)}
              disabled={!hasMentorProfile}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
            Video file (max {MAX_VIDEO_MB} MB)
          </span>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border-light bg-surface-sheet px-4 py-3 text-left hover:border-border-default disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
              <FileVideo size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-text-primary">
                {file ? file.name : "Choose a video file"}
              </span>
              <span className="truncate text-xs text-text-muted">
                {file ? formatFileSize(file.size) : `MP4, MOV, or WebM — up to ${MAX_VIDEO_MB} MB`}
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary">
              Browse
            </span>
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => {
              const picked = e.target.files?.[0] || null;
              if (picked && picked.size > MAX_VIDEO_MB * 1024 * 1024) {
                setError(`Video must be under ${MAX_VIDEO_MB} MB`);
                setFile(null);
                return;
              }
              setError("");
              setFile(picked);
            }}
            className="hidden"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Thumbnail (optional)
          </span>
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border-light bg-surface-sheet px-4 py-3 text-left hover:border-border-default disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
              <ImageIcon size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-text-primary">
                {thumbnailFile ? thumbnailFile.name : "Choose a thumbnail image"}
              </span>
              <span className="truncate text-xs text-text-muted">
                {thumbnailFile
                  ? formatFileSize(thumbnailFile.size)
                  : "Skip it and we'll grab a frame from the video"}
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary">
              Browse
            </span>
          </button>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        {uploading ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-chip">
              <div
                className="h-full rounded-full bg-accent-link transition-[width] duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">Uploading… {uploadProgress}%</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !title.trim()}
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <Upload size={16} />
          {uploading ? `Uploading… ${uploadProgress}%` : "Upload video"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Your videos ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No videos uploaded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {videos.slice(0, visibleCount).map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => setPlayingVideo(video)}
                  aria-label={`Play ${video.title}`}
                  className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-chip"
                >
                  {video.thumbnail_url ? (
                    <OptimizedImage src={video.thumbnail_url} alt={video.title} width={160} height={90} className="h-full w-full object-cover" />
                  ) : (
                    <VideoIcon size={18} className="text-text-muted" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <Play size={16} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{video.title}</p>
                  <button
                    type="button"
                    onClick={() => handleToggleFree(video)}
                    disabled={togglingId === video.id}
                    className={`text-xs font-medium ${video.is_free ? "text-accent-success" : "text-text-muted"} hover:underline disabled:opacity-50`}
                  >
                    {togglingId === video.id ? "Updating…" : video.is_free ? "Free preview — tap to lock" : "Locked — tap to make free"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVideo(video)}
                  aria-label="Edit video"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-chip hover:text-accent-link"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(video)}
                  aria-label="Delete video"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-chip hover:text-accent-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {visibleCount < videos.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="mt-1 rounded-xl border border-border-light py-2.5 text-sm font-semibold text-accent-link hover:bg-surface-chip"
              >
                Load more
              </button>
            ) : null}
          </div>
        )}
      </div>

      {playingVideo ? <PlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} /> : null}
      {editingVideo ? (
        <EditModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSaved={(updated) => setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))}
        />
      ) : null}
    </div>
  );
}
