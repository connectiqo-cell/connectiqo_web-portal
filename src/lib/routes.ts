/**
 * Web route map — the URL-path equivalent of connectfront's
 * src/navigators/screenNames.js + linkingConfig.js. Mobile deep links
 * (connectiqo://mentor/:id) map 1:1 to these paths, so booking
 * confirmations, referral links, and notification taps can point at either
 * client with the same path.
 */
export const ROUTES = {
  // Public / marketing
  home: "/",
  privacy: "/privacy",
  terms: "/terms",

  // Auth
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  interestsOnboarding: "/onboarding/interests",

  // Learner
  discover: "/discover",
  category: (category: string) => `/category/${encodeURIComponent(category)}`,
  recommended: "/recommended",
  bookings: "/bookings",

  // Mentor
  mentorProfileDashboard: "/mentor/profile",
  mentorSessions: "/mentor/sessions",
  mentorEarnings: "/mentor/earnings",
  mentorSchedule: "/mentor/schedule",

  // Shared / modal-equivalent routes
  mentorProfile: (mentorId: string) => `/mentor/${mentorId}`,
  mentorReviews: (mentorId: string) => `/mentor/${mentorId}/reviews`,
  booking: (mentorId: string) => `/booking/${mentorId}`,
  call: (bookingId: string) => `/call/${bookingId}`,
  review: (bookingId: string) => `/review/${bookingId}`,

  transactions: "/transactions",
  settings: "/settings",
  account: "/settings/account",
  editProfile: "/settings/profile",
  payoutSetup: "/settings/payout",
  recordings: "/settings/recordings",
  notifications: "/notifications",
} as const;
