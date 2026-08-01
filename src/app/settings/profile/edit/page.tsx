"use client";

import { ArrowLeft, Camera, Check, Plus, Trash2, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategories } from "@/lib/api/contentApi";
import { profileApi, type MentorProfileFields } from "@/lib/api/profileApi";
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

  // Mentor profile fields
  const [mentorProfile, setMentorProfile] = useState<MentorProfileFields | null>(null);
  const [mentorLoading, setMentorLoading] = useState(!isMentor);
  const [mentorSaving, setMentorSaving] = useState(false);
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

  useEffect(() => {
    if (!user || !isMentor) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await profileApi.getMentorProfile(user.id);
        if (cancelled) return;
        setMentorProfile(data);
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
        setSkills((data.skills as string[]) || []);
      } catch (err) {
        console.error("Could not load mentor profile:", err);
      } finally {
        if (!cancelled) setMentorLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isMentor]);

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

  const handleSaveMentorProfile = async () => {
    if (!user) return;
    setMentorSaving(true);
    setError("");
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
      setError((err as Error)?.message || "Could not save profile");
    } finally {
      setMentorSaving(false);
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-12">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Username
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary focus:outline-none"
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

      {isMentor && !mentorLoading ? (
        <div className="flex flex-col gap-4 border-t border-border-light pt-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Mentor Profile</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Manage your mentor profile and pricing
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Specialization
            </span>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Category
            </span>
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
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell learners about your background and how you can help them."
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Experience (years)
              </span>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Price per session (₹)
              </span>
              <input
                type="number"
                min={0}
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Location
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Website
            </span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. www.example.com"
              className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Skills
            </span>
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
          </label>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                LinkedIn
              </span>
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/…"
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Twitter / X
              </span>
              <input
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/…"
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Instagram
              </span>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/…"
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                YouTube
              </span>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@…"
                className="rounded-xl border border-border-light bg-surface-sheet px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSaveMentorProfile}
            disabled={mentorSaving}
            className="flex h-11 w-fit items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {mentorSaving ? "Saving…" : "Save mentor profile"}
          </button>
        </div>
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
