import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { collabHubApi } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

export interface Notification {
  id: string;
  type: string;
  category: "sessions" | "collabhub";
  title: string;
  body: string;
  timestamp: string;
  accent: "gold" | "teal" | "error" | "purple" | "muted";
  avatarUrl: string | null;
  bookingId: string;
  role: "learner" | "mentor";
  status: string;
  /** Set only for category "collabhub" — the notifications page links straight here instead of deriving a booking-shaped destination. */
  href?: string;
}

type Role = "learner" | "mentor";

const STATUS_MESSAGES: Record<
  Role,
  Record<string, { title: string; body: (name: string, date: string) => string; accent: Notification["accent"] }>
> = {
  learner: {
    pending: {
      title: "Booking submitted",
      body: (name) => `Waiting for ${name} to confirm your session.`,
      accent: "gold",
    },
    confirmed: {
      title: "Session confirmed",
      body: (name, date) => `${name} confirmed your session${date ? ` on ${date}` : ""}.`,
      accent: "teal",
    },
    rejected: {
      title: "Session declined",
      body: (name) => `${name} could not accept your session.`,
      accent: "error",
    },
    completed: {
      title: "Session completed",
      body: (name) => `Your session with ${name} is complete. Leave a review!`,
      accent: "purple",
    },
    cancelled: {
      title: "Session cancelled",
      body: (name) => `Your session with ${name} was cancelled.`,
      accent: "error",
    },
    reschedule_needed: {
      title: "Reschedule needed",
      body: (name) => `Your session with ${name} needs a new time.`,
      accent: "gold",
    },
    reschedule_proposed: {
      title: "New time proposed",
      body: (name) => `${name} proposed a new time for your session.`,
      accent: "gold",
    },
    reschedule_unresolved: {
      title: "Reschedule unresolved",
      body: (name) => `Your session with ${name} could not be rescheduled.`,
      accent: "error",
    },
  },
  mentor: {
    pending: {
      title: "New booking request",
      body: (name, date) => `${name} requested a session${date ? ` on ${date}` : ""}.`,
      accent: "gold",
    },
    confirmed: {
      title: "Session scheduled",
      body: (name, date) => `You confirmed a session with ${name}${date ? ` on ${date}` : ""}.`,
      accent: "teal",
    },
    completed: {
      title: "Session completed",
      body: (name) => `Your session with ${name} is marked complete.`,
      accent: "purple",
    },
    cancelled: {
      title: "Session cancelled",
      body: (name) => `${name}'s session was cancelled.`,
      accent: "error",
    },
    rejected: {
      title: "Session declined",
      body: (name) => `You declined ${name}'s booking request.`,
      accent: "muted",
    },
    reschedule_needed: {
      title: "Reschedule needed",
      body: (name) => `Propose a new time for your session with ${name}.`,
      accent: "gold",
    },
    reschedule_proposed: {
      title: "Proposal sent",
      body: (name) => `Waiting for ${name} to respond to your proposed time.`,
      accent: "gold",
    },
    reschedule_unresolved: {
      title: "Reschedule unresolved",
      body: (name) => `Your session with ${name} could not be rescheduled.`,
      accent: "error",
    },
  },
};

function formatSlotDate(slot: BookingRow["availability_slots"]) {
  if (!slot?.date) return "";
  const d = new Date(`${slot.date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return slot.date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function bookingToNotification(booking: BookingRow, role: Role): Notification | null {
  const cfg = STATUS_MESSAGES[role][booking.status];
  if (!cfg) return null;

  const profile = role === "learner" ? booking.profiles : booking.learner_profile;
  const name = profile?.name || (role === "learner" ? "Your mentor" : "A learner");
  const dateStr = formatSlotDate(booking.availability_slots);

  return {
    id: `${role}-${booking.id}-${booking.status}`,
    type: `booking_${booking.status}`,
    category: "sessions",
    title: cfg.title,
    body: cfg.body(name, dateStr),
    timestamp: booking.created_at,
    accent: cfg.accent,
    avatarUrl: profile?.avatar_url ?? null,
    bookingId: booking.id,
    role,
    status: booking.status,
  };
}

/** CollabHub: a creator being shortlisted/accepted/rejected is derived the
 * same way booking-status notifications are — no separate notifications
 * table exists in this app (see module comment below), so this follows suit
 * rather than introducing one just for this. */
async function collabHubNotifications(userId: string): Promise<Notification[]> {
  const applications = await collabHubApi.getMyApplications(userId).catch(() => []);
  const notifications: Notification[] = [];
  for (const app of applications) {
    if (app.status !== "shortlisted" && app.status !== "accepted" && app.status !== "rejected") continue;
    const title = app.campaign?.title || "a campaign";
    notifications.push({
      id: `collabhub-${app.id}-${app.status}`,
      type: `campaign_application_${app.status}`,
      category: "collabhub",
      title:
        app.status === "accepted"
          ? "You're in!"
          : app.status === "shortlisted"
            ? "You've been shortlisted"
            : "Application update",
      body:
        app.status === "accepted"
          ? `You were selected for "${title}" — start creating your video.`
          : app.status === "shortlisted"
            ? `You've been shortlisted for "${title}" — the brand is reviewing finalists.`
            : `Your application to "${title}" wasn't selected this time.`,
      timestamp: app.decided_at || app.applied_at,
      accent: app.status === "accepted" ? "teal" : app.status === "shortlisted" ? "gold" : "muted",
      avatarUrl: null,
      bookingId: "",
      role: "learner",
      status: app.status,
      href: ROUTES.collabHubCampaign(app.campaign_id),
    });
  }
  return notifications;
}

/** Brand side: new applicants + submitted videos awaiting review, across
 * every campaign the brand owns. Same derived-not-stored pattern as
 * collabHubNotifications above, mirrored for the other side of the feature. */
async function brandCollabHubNotifications(brandId: string): Promise<Notification[]> {
  const [pendingApplications, awaitingReview] = await Promise.all([
    collabHubApi.getPendingApplicationsForBrand(brandId).catch(() => []),
    collabHubApi.getSubmissionsAwaitingReviewForBrand(brandId).catch(() => []),
  ]);

  const notifications: Notification[] = [];
  for (const app of pendingApplications) {
    const campaignTitle = app.campaign?.title || "your campaign";
    const creatorName = app.creator?.name || "A creator";
    const isShortlisted = app.status === "shortlisted";
    notifications.push({
      id: `brand-applicant-${app.id}-${app.status}`,
      type: isShortlisted ? "campaign_shortlisted_awaiting_decision" : "campaign_new_applicant",
      category: "collabhub",
      title: isShortlisted ? "Shortlisted — needs a decision" : "New applicant",
      body: isShortlisted
        ? `${creatorName} is shortlisted for "${campaignTitle}" — accept or reject to move forward.`
        : `${creatorName} applied to "${campaignTitle}".`,
      timestamp: app.decided_at || app.applied_at,
      accent: "gold",
      avatarUrl: app.creator?.avatar_url ?? null,
      bookingId: "",
      role: "mentor",
      status: app.status,
      href: ROUTES.brandCampaign(app.campaign_id),
    });
  }
  for (const submission of awaitingReview) {
    const campaignTitle = submission.campaign_title || "your campaign";
    notifications.push({
      id: `brand-submission-${submission.id}`,
      type: "campaign_submission_awaiting_review",
      category: "collabhub",
      title: "Video submitted",
      body: `A creator submitted a video for "${campaignTitle}" — ready for your review.`,
      timestamp: submission.submitted_at,
      accent: "teal",
      avatarUrl: null,
      bookingId: "",
      role: "mentor",
      status: submission.status,
      href: ROUTES.brandCampaign(submission.campaign_id || ""),
    });
  }
  return notifications;
}

/**
 * Ported from connectfront/src/api/notificationApi.js — notifications are
 * derived entirely from booking status, not a separate table (mobile never
 * built a real notifications backend either; see 19april2026_note_process.txt).
 */
export const notificationApi = {
  getNotifications: async (userId: string, isBrand = false): Promise<Notification[]> => {
    if (!userId) return [];

    if (isBrand) {
      const brandNotifications = await brandCollabHubNotifications(userId);
      return brandNotifications.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }

    const [learnerBookings, mentorBookings, collabHub] = await Promise.all([
      bookingApi.getBookingsByLearner(userId).catch(() => []),
      bookingApi.getBookingsByMentor(userId).catch(() => []),
      collabHubNotifications(userId),
    ]);

    const notifications: Notification[] = [...collabHub];
    learnerBookings.forEach((b) => {
      const n = bookingToNotification(b, "learner");
      if (n) notifications.push(n);
    });
    mentorBookings.forEach((b) => {
      const n = bookingToNotification(b, "mentor");
      if (n) notifications.push(n);
    });

    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 60);
  },
};
