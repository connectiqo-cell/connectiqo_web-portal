import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { mentorApi } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";
import { createPublicClient } from "@/lib/supabase/publicClient";

interface PageProps {
  params: Promise<{ mentorId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorId } = await params;
  const supabase = createPublicClient();
  const mentor = await mentorApi.getMentorWithProfile(supabase, mentorId).catch(() => null);
  const name = mentor?.profiles?.name || "Mentor";
  return { title: `Book a session with ${name} — Connectiqo` };
}

export default async function BookingPage({ params }: PageProps) {
  const { mentorId } = await params;
  const supabase = createPublicClient();
  const mentor = await mentorApi.getMentorWithProfile(supabase, mentorId).catch(() => null);
  if (!mentor) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.mentorProfile(mentorId)}
          className="flex w-fit items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          {mentor.profiles?.name || "Mentor"}&apos;s profile
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">
          Book a session with {mentor.profiles?.name || "your mentor"}
        </h1>
        {mentor.price_per_hour ? (
          <p className="text-text-secondary">₹{mentor.price_per_hour} per session</p>
        ) : null}
      </div>

      <BookingFlow mentorId={mentorId} mentor={mentor} />
    </main>
    
  );
}
