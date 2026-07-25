/**
 * Ported (subset used by onboarding) from connectfront/src/utils/mentorCategories.js.
 */
export function parseMentorCategories(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((c) => String(c).trim()).filter(Boolean))];
  }
  return [...new Set(String(raw).split(",").map((c) => c.trim()).filter(Boolean))];
}

export const OTHER_CATEGORY_LABEL = "Other";

/** True for empty / Other / Others-style labels. */
export function isOtherCategoryLabel(name: unknown): boolean {
  const lower = String(name || "").trim().toLowerCase();
  return !lower || lower === "other" || lower === "others";
}

/**
 * Canonical Discover bucket label. Merges empty categories and Other/Others
 * into a single "Other" section.
 */
export function normalizeCategoryBucket(name: unknown): string {
  const trimmed = String(name || "").trim();
  if (isOtherCategoryLabel(trimmed)) return OTHER_CATEGORY_LABEL;
  return trimmed;
}

/** Whether a mentor's stored category field includes the given category name. */
export function mentorHasCategory(rawCategory: unknown, categoryName: unknown): boolean {
  const target = String(categoryName || "").trim().toLowerCase();
  if (!target) return false;

  const parsed = parseMentorCategories(rawCategory);
  if (isOtherCategoryLabel(categoryName)) {
    return parsed.length === 0 || parsed.some((c) => isOtherCategoryLabel(c));
  }

  return parsed.some((c) => c.toLowerCase() === target);
}

/**
 * Quote a PostgREST filter value so commas / reserved chars don't break `.or()`.
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#operators
 */
export function quotePostgrestFilterValue(value: unknown): string {
  const escaped = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/** PostgREST .or() filter for mentors that include a category (single or multi-value field). */
export function buildCategoryMatchOrFilter(categoryName: unknown): string {
  const cat = String(categoryName || "").trim();
  if (!cat) return "category.is.null";

  if (isOtherCategoryLabel(cat)) {
    return [
      "category.is.null",
      `category.eq.${quotePostgrestFilterValue("Other")}`,
      `category.eq.${quotePostgrestFilterValue("Others")}`,
      `category.ilike.${quotePostgrestFilterValue("other")}`,
      `category.ilike.${quotePostgrestFilterValue("others")}`,
    ].join(",");
  }

  return [
    `category.eq.${quotePostgrestFilterValue(cat)}`,
    `category.ilike.${quotePostgrestFilterValue(`${cat},%`)}`,
    `category.ilike.${quotePostgrestFilterValue(`%, ${cat}`)}`,
    `category.ilike.${quotePostgrestFilterValue(`%, ${cat},%`)}`,
  ].join(",");
}

export function toggleMentorCategory(selected: string[], categoryName: string): string[] {
  const cat = String(categoryName || "").trim();
  if (!cat) return parseMentorCategories(selected);
  const list = parseMentorCategories(selected);
  const lower = cat.toLowerCase();
  const exists = list.some((c) => c.toLowerCase() === lower);
  if (exists) return list.filter((c) => c.toLowerCase() !== lower);
  return [...list, cat];
}

export const MIN_LEARNER_INTERESTS = 5;
export const MAX_LEARNER_INTERESTS = 5;

/** Interests that match known mentor category names (case-insensitive). */
export function matchCategoryInterests(
  interests: unknown,
  knownCategories: string[] = [],
): string[] {
  const knownByLower = new Map(
    (knownCategories || [])
      .map((c) => String(c).trim())
      .filter(Boolean)
      .map((c) => [c.toLowerCase(), c] as const),
  );
  if (!knownByLower.size) return [];

  const seen = new Set<string>();
  const matched: string[] = [];
  for (const raw of parseMentorCategories(interests)) {
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    const canonical = knownByLower.get(key);
    if (!canonical) continue;
    seen.add(key);
    matched.push(canonical);
  }
  return matched;
}

/** True when the learner still needs first-run category interest selection. */
export function needsCategoryInterestOnboarding(
  interests: unknown,
  knownCategories: string[] = [],
): boolean {
  return matchCategoryInterests(interests, knownCategories).length < MIN_LEARNER_INTERESTS;
}
