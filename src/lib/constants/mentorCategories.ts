/**
 * Static fallback — used if the DB is unavailable. Ported from
 * connectfront/src/constants/mentorCategories.js. Source of truth is the
 * `mentor_categories` table in Supabase.
 */
export const MENTOR_CATEGORIES = [
  "Technology",
  "Software Development",
  "AI & Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Business",
  "Entrepreneurship",
  "Product Management",
  "Finance & Investing",
  "Digital Marketing",
  "Content Creation",
  "Design & UX",
  "Photography & Video",
  "Personal Development",
  "Health & Wellness",
  "Education & Coaching",
  "Legal",
  "Sales",
  "Other",
] as const;

export type MentorCategory = (typeof MENTOR_CATEGORIES)[number];
