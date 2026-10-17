"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CampaignForm } from "@/components/collabhub/CampaignForm";
import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await collabHubApi.getCampaign(campaignId);
        if (!cancelled) setCampaign(c);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load campaign");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (!user || loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-chip" />;
  }
  if (error) return <p className="text-sm text-accent-error">{error}</p>;
  if (!campaign) return <p className="text-sm text-accent-error">Campaign not found.</p>;
  if (campaign.brand_id !== user.id) return <p className="text-sm text-accent-error">Not authorized.</p>;

  return <CampaignForm brandId={user.id} mode="edit" campaignId={campaign.id} initialCampaign={campaign} />;
}
