"use client";

import { Award, Camera, Plus, Star, Trash2, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, type MentorProfileFields } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";

export default function MentorProfileDashboardPage() {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<MentorProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [pricePerHour, setPricePerHour] = useState("0");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await profileApi.getMentorProfile(user.id);
        if (cancelled) return;

        setProfile(data);
        setSpecialization(data.specialization || "");
        setCategory(data.category || "");
        setBio(data.bio || "");
        setExperienceYears(String(data.experience_years ?? 0));
        setPricePerHour(String(data.price_per_hour ?? 0));
        setLocation(data.location || "");
        setWebsite(data.website || "");
        setLinkedinUrl(data.linkedin_url || "");
        setTwitterUrl(data.twitter_url || "");
        setInstagramUrl(data.instagram_url || "");
        setYoutubeUrl(data.youtube_url || "");
        setSkills(data.skills || []);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load your mentor profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
      await profileApi.updateMentorProfile({
        userId: user.id,
        specialization: specialization.trim(),
        bio: bio.trim(),
        category,
        experienceYears: Number(experienceYears) || 0,
        pricePerHour: Number(pricePerHour) || 0,
        location: location.trim(),
        website: website.trim(),
        linkedinUrl: linkedinUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        skills,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (!skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkills((prev) => [...prev, value]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Avatar Section */}
      <div className="flex items-center gap-4 pb-6 border-b border-border-light">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-chip"
          aria-label="Change photo"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <Users size={28} className="text-text-muted" />
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Manage Profile</h1>
        <p className="text-sm text-text-muted">Keep your mentor profile up to date</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile icon={Star} label="Rating" value={(profile?.rating ?? 0).toFixed(1)} />
        <StatTile icon={Users} label="Sessions" value={String(profile?.total_sessions ?? 0)} />
        <StatTile icon={Award} label="Experience" value={`${profile?.experience_years ?? 0} yrs`} />
      </div>

      {!pricePerHourIsSet(profile) ? (
        <p className="rounded-xl border border-accent-warning/40 bg-accent-warning/10 px-3.5 py-2.5 text-sm text-accent-warning">
          Set your hourly price below — learners can&apos;t book you until you do.
        </p>
      ) : null}

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      {saved ? <p className="text-sm text-accent-success">Saved.</p> : null}

      {/* About You Section */}
      <div>
        <h2 className="text-sm font-bold text-text-primary mb-4">About You</h2>
        <div className="flex flex-col gap-4">
        <Field label="Specialization">
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
          >
            <option value="">Select a category</option>
            {MENTOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell learners about your background and how you can help them."
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Experience (years)">
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </Field>
          <Field label="Price per session (₹)">
            <input
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pune, Maharashtra, India"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
          <Field label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. www.example.com"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full border border-accent-link/50 bg-accent-link/15 px-3 py-1.5 text-xs font-semibold text-accent-link"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  className="hover:opacity-70"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="e.g. React, Public Speaking"
              className="flex-1 rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border-light px-3.5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LinkedIn">
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/…"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
          <Field label="Twitter / X">
            <input
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/…"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
          <Field label="Instagram">
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/…"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
          <Field label="YouTube">
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@…"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-11 w-fit items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        </div>
      </div>

      {showCamera ? (
        <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      ) : null}
    </div>
  );
}

function pricePerHourIsSet(profile: MentorProfileFields | null) {
  return Boolean(profile?.price_per_hour);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-light bg-surface-panel py-3">
      <Icon size={16} className="text-accent-link" />
      <span className="text-sm font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
