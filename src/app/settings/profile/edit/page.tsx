"use client";

import { ArrowLeft, Camera, Check, ChevronRight, Plus, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategories } from "@/lib/api/contentApi";
import { profileApi } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";
import { toggleMentorCategory } from "@/lib/utils/mentorCategories";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const isLearner = profile?.role !== "mentor";
  const isMentor = profile?.role === "mentor" || profile?.role === "both";

  // Learner interests
  const [categories, setCategories] = useState<string[]>([...MENTOR_CATEGORIES]);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsLoaded, setInterestsLoaded] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);
  const [interestsError, setInterestsError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!profile) return;
    // Deferred to a microtask so this reacts to `profile` arriving/changing
    // rather than setting state synchronously inside the effect body.
    void Promise.resolve().then(() => {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || null);
    });
  }, [profile]);

  useEffect(() => {
    if (!user || !isLearner) return;
    let cancelled = false;
    (async () => {
      const [rows, learnerProfile] = await Promise.all([
        fetchActiveCategories().catch(() => []),
        profileApi.getLearnerProfile(user.id).catch(() => null),
      ]);
      if (cancelled) return;
      if (rows.length) setCategories(rows.map((r) => r.name));
      setInterests(learnerProfile?.interests || []);
      setInterestsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isLearner]);

  const handleToggleInterest = (category: string) => {
    setInterests((prev) => toggleMentorCategory(prev, category));
  };

  const handleSaveInterests = async () => {
    if (!user) return;
    setSavingInterests(true);
    setInterestsError("");
    setInterestsSaved(false);
    try {
      await profileApi.updateLearnerProfile({ userId: user.id, interests });
      setInterestsSaved(true);
      setTimeout(() => setInterestsSaved(false), 2500);
    } catch (err) {
      setInterestsError((err as Error)?.message || "Could not save interests");
    } finally {  
      setSavingInterests(false);
    }
  };

  const uploadAvatarFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError("");
    try {
      const url = await profileApi.uploadAvatar({ userId: user.id, file });
      setAvatarUrl(url);
      refreshProfile();
    } catch (err) {
      setError((err as Error)?.message || "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
  };

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false);
    await uploadAvatarFile(file);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    if (!window.confirm("Remove your profile photo?")) return;
    setUploading(true);
    setError("");
    try {
      await profileApi.removeAvatar({ userId: user.id });
      setAvatarUrl(null);
      refreshProfile();
    } catch (err) {
      setError((err as Error)?.message || "Could not remove photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await profileApi.updateProfile({ userId: user.id, name, username });
      refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href={ROUTES.editProfile}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={15} />
        Back to profile
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-chip"
          aria-label="Change photo"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <User size={28} className="text-text-muted" />
          )}
        </button>
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-semibold text-accent-link disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload from device"}
          </button>
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-60"
          >
            <Camera size={14} />
            Take a photo
          </button>
          {avatarUrl ? (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="flex items-center gap-1.5 text-sm font-semibold text-accent-error hover:opacity-80 disabled:opacity-60"
            >
              <Trash2 size={14} />
              Remove photo
            </button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      {saved ? <p className="text-sm text-accent-success">Saved.</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Username
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex h-11 w-fit items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>

      {isMentor ? (
        <Link
          href={ROUTES.mentorProfileDashboard}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border-light bg-surface-sheet px-4 py-3.5 text-left hover:border-border-default"
        >
          <div>
            <p className="text-sm font-semibold text-text-primary">Manage your mentor profile</p>
            <p className="mt-0.5 text-xs text-text-muted">
              Specialization, bio, pricing, skills and social links
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-text-muted" />
        </Link>
      ) : null}

      {isLearner ? (
        <div className="flex flex-col gap-3 border-t border-border-light pt-6">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Interests</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Add or remove categories to fine-tune your &quot;Recommended for you&quot; feed.
            </p>
          </div>

          {!interestsLoaded ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {interests.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleToggleInterest(category)}
                    className="flex items-center gap-1.5 rounded-full border border-accent-link/50 bg-accent-link/15 px-3 py-1.5 text-xs font-semibold text-accent-link"
                  >
                    <Check size={12} />
                    {category}
                  </button>
                ))}
                {interests.length === 0 ? (
                  <p className="text-xs text-text-muted">No interests selected yet.</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Add more
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c) => !interests.some((i) => i.toLowerCase() === c.toLowerCase()))
                    .map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleToggleInterest(category)}
                        className="flex items-center gap-1.5 rounded-full border border-border-light px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                      >
                        <Plus size={12} />
                        {category}
                      </button>
                    ))}
                </div>
              </div>

              {interestsError ? <p className="text-sm text-accent-error">{interestsError}</p> : null}
              {interestsSaved ? <p className="text-sm text-accent-success">Saved.</p> : null}

              <button
                type="button"
                onClick={handleSaveInterests}
                disabled={savingInterests}
                className="flex h-11 w-fit items-center justify-center rounded-full border border-border-light px-6 text-sm font-semibold text-text-secondary disabled:opacity-60"
              >
                {savingInterests ? "Saving…" : "Save interests"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {showCamera ? (
        <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      ) : null}
    </main>
  );
}
