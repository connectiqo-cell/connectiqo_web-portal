"use client";

import { Camera, FileText, ImageIcon, IndianRupee, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { collabHubApi, type Campaign, type CampaignInput } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

// Reuses the same taxonomy as a brand's own industry (set at onboarding) —
// a campaign's category is conceptually the same classification, just
// scoped per-campaign instead of per-brand.
const CATEGORY_OPTIONS = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Food & Beverage",
  "Tech & Apps",
  "Fitness & Wellness",
  "Travel & Hospitality",
  "Finance",
  "Other",
];

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

export function CampaignForm({
  brandId,
  mode,
  campaignId,
  initialCampaign,
}: {
  brandId: string;
  mode: "create" | "edit";
  campaignId?: string;
  initialCampaign?: Campaign;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverImageUrl, setCoverImageUrl] = useState(initialCampaign?.cover_image_url || "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState(initialCampaign?.title || "");
  const [description, setDescription] = useState(initialCampaign?.description || "");
  const [objectives, setObjectives] = useState(initialCampaign?.objectives || "");
  const [category, setCategory] = useState(initialCampaign?.category || "");
  const [contentType, setContentType] = useState(initialCampaign?.content_type || "");
  const [targetAudience, setTargetAudience] = useState(initialCampaign?.target_audience || "");
  // No longer collected via this form (platform targeting wasn't useful in
  // practice) — preserved unmodified rather than dropped, so re-saving an
  // existing campaign that already has platforms set doesn't wipe them.
  const platforms = initialCampaign?.platforms || null;
  const [videoDuration, setVideoDuration] = useState(
    initialCampaign?.video_duration_seconds ? String(initialCampaign.video_duration_seconds) : "",
  );
  const [eligibilityCriteria, setEligibilityCriteria] = useState(initialCampaign?.eligibility_criteria || "");
  const [minFollowers, setMinFollowers] = useState(
    initialCampaign?.min_followers ? String(initialCampaign.min_followers) : "",
  );
  const [budgetPerWinner, setBudgetPerWinner] = useState(
    initialCampaign?.budget_per_winner ? String(initialCampaign.budget_per_winner) : "",
  );
  const [winnerCount, setWinnerCount] = useState(String(initialCampaign?.winner_count || 1));
  const [contentUsageRights, setContentUsageRights] = useState(initialCampaign?.content_usage_rights || "");
  const [applicationDeadline, setApplicationDeadline] = useState(
    initialCampaign?.application_deadline ? initialCampaign.application_deadline.slice(0, 10) : "",
  );
  const [submissionDeadline, setSubmissionDeadline] = useState(
    initialCampaign?.submission_deadline ? initialCampaign.submission_deadline.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const url = await collabHubApi.uploadCampaignCoverImage({ brandId, file });
      setCoverImageUrl(url);
    } catch (err) {
      setError((err as Error)?.message || "Could not upload the cover image");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const buildFields = (): CampaignInput => ({
    title: title.trim(),
    description: description.trim(),
    objectives: objectives.trim() || null,
    content_type: contentType.trim() || null,
    target_audience: targetAudience.trim() || null,
    platforms,
    video_duration_seconds: videoDuration ? Number(videoDuration) : null,
    eligibility_criteria: eligibilityCriteria.trim() || null,
    min_followers: minFollowers ? Number(minFollowers) : null,
    budget_per_winner: Number(budgetPerWinner) || 0,
    winner_count: Number(winnerCount) || 1,
    content_usage_rights: contentUsageRights.trim() || null,
    category: category || null,
    cover_image_url: coverImageUrl || null,
    location: null,
    application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
    submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
  });

  const handleSubmit = async (publish?: boolean) => {
    if (!title.trim() || !description.trim() || !budgetPerWinner) {
      setError("Title, description, and budget per winner are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        const campaign = await collabHubApi.createCampaign({ brandId, fields: buildFields(), publish: publish ?? false });
        router.push(ROUTES.brandCampaign(campaign.id));
      } else if (campaignId) {
        await collabHubApi.updateCampaign({ campaignId, fields: buildFields() });
        router.push(ROUTES.brandCampaign(campaignId));
      }
    } catch (err) {
      setError((err as Error)?.message || "Could not save campaign");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <Section title="Campaign Basics" icon={Sparkles}>
        <Field label="Cover Image">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-light bg-surface-sheet disabled:opacity-60"
            >
              {coverImageUrl ? (
                <OptimizedImage src={coverImageUrl} alt="Campaign cover" width={128} height={80} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-text-muted" />
              )}
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCover}
                className="flex items-center gap-1.5 text-sm font-semibold text-accent-link disabled:opacity-60"
              >
                <Camera size={14} />
                {uploadingCover ? "Uploading…" : coverImageUrl ? "Change image" : "Upload image"}
              </button>
              <p className="text-xs text-text-muted">Shown on Collab Hub — helps your campaign stand out to creators.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </div>
        </Field>

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
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type of Content Required">
            <input value={contentType} onChange={(e) => setContentType(e.target.value)} className={inputClass} placeholder="e.g. Instagram Reel" />
          </Field>
        </div>

        <Field label="Target Audience">
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} placeholder="e.g. Gen Z, fashion-forward" />
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
        {mode === "create" ? (
          <>
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
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="h-11 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
