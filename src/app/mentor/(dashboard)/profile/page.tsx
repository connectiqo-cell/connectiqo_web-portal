"use client";

import { Award, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi, type MentorProfileFields } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";

export default function MentorProfileDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [specialization, setSpecialization] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [pricePerHour, setPricePerHour] = useState("0");

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await profileApi.updateMentorProfile({
        userId: user.id,
        specialization,
        bio,
        category,
        experienceYears: Number(experienceYears) || 0,
        pricePerHour: Number(pricePerHour) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
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

        <div className="grid grid-cols-2 gap-4">
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
