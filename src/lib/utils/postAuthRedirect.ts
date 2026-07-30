import { fetchActiveCategoryNames } from "@/lib/api/contentApi";
import { profileApi } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { needsCategoryInterestOnboarding } from "@/lib/utils/mentorCategories";
import { ROUTES } from "@/lib/routes";

/**
 * Mirrors RootNavigator.js's checkInterestsOnboarding gate: send the user to
 * video welcome page if they haven't picked >= MIN_LEARNER_INTERESTS yet,
 * otherwise straight into the app.
 */
export async function resolvePostLoginRoute(
  userId: string,
  fallback: string = ROUTES.home,
): Promise<string> {
  try {
    const [learner, categoryNames] = await Promise.all([
      profileApi.getLearnerProfile(userId).catch(() => null),
      fetchActiveCategoryNames(),
    ]);
    const known = categoryNames.length ? categoryNames : [...MENTOR_CATEGORIES];
    if (needsCategoryInterestOnboarding(learner?.interests, known)) {
      return "/onboarding";
    }
    return fallback;
  } catch {
    // Fail open so a profile blip doesn't block login.
    return fallback;
  }
}
