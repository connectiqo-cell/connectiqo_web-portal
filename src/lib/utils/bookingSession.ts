interface BookingLike {
  status?: string | null;
  availability_slots?: {
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  } | null;
}

/** Ported from connectfront/src/utils/bookingSession.js. True once the booked slot has ended. */
export function isBookingSessionPast(booking: BookingLike): boolean {
  const date = booking?.availability_slots?.date;
  if (!date) return false;

  const startTime = booking?.availability_slots?.start_time;
  const endTime = booking?.availability_slots?.end_time;
  const now = new Date();

  if (startTime) {
    const startDt = new Date(`${date}T${startTime}`);
    if (startDt > now) return false;

    if (endTime) {
      const endDt = new Date(`${date}T${endTime}`);
      if (endDt < now) return true;
      return false;
    }

    const cutoff = new Date(startDt);
    cutoff.setHours(cutoff.getHours() + 2);
    return cutoff < now;
  }

  if (endTime) {
    return new Date(`${date}T${endTime}`) < now;
  }

  return new Date(`${date}T23:59:59`) < now;
}

/** Pending/confirmed booking whose slot ended without completion. */
export function isExpiredBooking(booking: BookingLike): boolean {
  if (!isBookingSessionPast(booking)) return false;
  const status = (booking?.status || "").toLowerCase();
  if (status === "completed" || status === "cancelled" || status === "rejected") return false;
  return status === "pending" || status === "confirmed";
}
