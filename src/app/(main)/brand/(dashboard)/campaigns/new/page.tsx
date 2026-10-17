"use client";

import { CampaignForm } from "@/components/collabhub/CampaignForm";
import { useAuth } from "@/contexts/AuthContext";

export default function NewCampaignPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <CampaignForm brandId={user.id} mode="create" />;
}
