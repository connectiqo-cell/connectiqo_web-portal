"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/lib/routes";

export default function MentorProfileDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.editProfileForm);
  }, [router]);

  return null;
}
