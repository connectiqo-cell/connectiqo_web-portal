import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CategoryView } from "@/components/discover/CategoryView";
import { mentorApi } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";
import { createPublicClient } from "@/lib/supabase/publicClient";

const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const name = decodeURIComponent(category);
  return {
    title: `${name} Mentors — Connectiqo`,
    description: `Browse ${name} mentors available for live 1-on-1 sessions on Connectiqo.`,
  };
}

export const revalidate = 300;

export default async function CategoryPage({ params }: PageProps) {
  const { category: encoded } = await params;
  const category = decodeURIComponent(encoded);

  const supabase = createPublicClient();
  const mentors = await mentorApi
    .getMentorsByCategoryName(supabase, category, 0, PAGE_SIZE)
    .catch(() => []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.discover}
          className="flex w-fit items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          All categories
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">{category}</h1>
        <p className="text-text-secondary">Browse mentors in this category.</p>
      </div>

      <CategoryView
        category={category}
        initialMentors={mentors}
        initialHasMore={mentors.length === PAGE_SIZE}
      />
    </main>
  );
}
