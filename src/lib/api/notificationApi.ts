import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";

export interface Notification {
  id: string;
  type: string;
  category: "sessions";
  title: string;
  body: string;
  timestamp: string;
  accent: "gold" | "teal" | "error" | "purple" | "muted";
  avatarUrl: string | null;
  bookingId: string;
  role: "learner" | "mentor";
  status: string;
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
    reschedule_pending: {
      title: "Reschedule needed",
      body: (name) => `Your session with ${name} needs a new time.`,
      accent: "gold",
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
    reschedule_pending: {
      title: "Reschedule needed",
      body: (name) => `Propose a new time for your session with ${name}.`,
      accent: "gold",
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

/**
 * Ported from connectfront/src/api/notificationApi.js — notifications are
 * derived entirely from booking status, not a separate table (mobile never
 * built a real notifications backend either; see 19april2026_note_process.txt).
 */
export const notificationApi = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (!userId) return [];

    const [learnerBookings, mentorBookings] = await Promise.all([
      bookingApi.getBookingsByLearner(userId).catch(() => []),
      bookingApi.getBookingsByMentor(userId).catch(() => []),
    ]);

    const notifications: Notification[] = [];
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
