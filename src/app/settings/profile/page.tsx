"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";

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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
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
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-semibold text-accent-link disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
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

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Username
        </span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex h-11 w-fit items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </main>
  );
}
