"use client";

import { FileText, IndianRupee, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type CampaignInput } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

const PLATFORM_OPTIONS = ["Instagram", "YouTube", "TikTok", "X"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent-link">
        <Icon size={14} />
        {title}
      </h2>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [contentType, setContentType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [videoDuration, setVideoDuration] = useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [budgetPerWinner, setBudgetPerWinner] = useState("");
  const [winnerCount, setWinnerCount] = useState("1");
  const [contentUsageRights, setContentUsageRights] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const buildFields = (): CampaignInput => ({
    title: title.trim(),
    description: description.trim(),
    objectives: objectives.trim() || null,
    content_type: contentType.trim() || null,
    target_audience: targetAudience.trim() || null,
    platforms: platforms.length ? platforms : null,
    video_duration_seconds: videoDuration ? Number(videoDuration) : null,
    eligibility_criteria: eligibilityCriteria.trim() || null,
    min_followers: minFollowers ? Number(minFollowers) : null,
    budget_per_winner: Number(budgetPerWinner) || 0,
    winner_count: Number(winnerCount) || 1,
    content_usage_rights: contentUsageRights.trim() || null,
    category: null,
    location: null,
    application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
    submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
  });

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;
    if (!title.trim() || !description.trim() || !budgetPerWinner) {
      setError("Title, description, and budget per winner are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const campaign = await collabHubApi.createCampaign({ brandId: user.id, fields: buildFields(), publish });
      router.push(ROUTES.brandCampaign(campaign.id));
    } catch (err) {
      setError((err as Error)?.message || "Could not create campaign");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <Section title="Campaign Basics" icon={Sparkles}>
        <Field label="Campaign Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Summer Skincare Launch" />
        </Field>

        <Field label="Campaign Description *">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
        </Field>

        <Field label="Objectives">
          <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className={inputClass} placeholder="What should this campaign achieve?" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type of Content Required">
            <input value={contentType} onChange={(e) => setContentType(e.target.value)} className={inputClass} placeholder="e.g. Instagram Reel" />
          </Field>
          <Field label="Target Audience">
            <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} placeholder="e.g. Gen Z, fashion-forward" />
          </Field>
        </div>

        <Field label="Platforms">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  platforms.includes(p)
                    ? "border-accent-link bg-accent-link/10 text-accent-link"
                    : "border-border-light text-text-secondary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Creator Requirements" icon={FileText}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Video Duration (seconds)">
            <input type="number" min={0} value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Minimum Followers">
            <input type="number" min={0} value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Creator Requirements / Eligibility">
          <textarea value={eligibilityCriteria} onChange={(e) => setEligibilityCriteria(e.target.value)} rows={2} className={inputClass} />
        </Field>

        <Field label="Content Usage Rights">
          <textarea
            value={contentUsageRights}
            onChange={(e) => setContentUsageRights(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="How can your brand use the winning content afterward?"
          />
        </Field>
      </Section>

      <Section title="Budget & Timeline" icon={IndianRupee}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Budget per Winner (₹) *">
            <input type="number" min={1} value={budgetPerWinner} onChange={(e) => setBudgetPerWinner(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Number of Winners">
            <input type="number" min={1} value={winnerCount} onChange={(e) => setWinnerCount(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Application Deadline">
            <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Submission Deadline">
            <input type="date" value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="h-11 rounded-full border border-border-light px-6 text-sm font-semibold text-text-primary disabled:opacity-60"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="h-11 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          {saving ? "Publishing…" : "Publish Campaign"}
        </button>
      </div>
    </div>
  );
}
