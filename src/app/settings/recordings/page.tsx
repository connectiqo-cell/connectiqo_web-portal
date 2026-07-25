"use client";

import { PlayCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type RecordedSession } from "@/lib/api/bookingApi";
import { ROUTES } from "@/lib/routes";
import { normalizeRecordingUrl } from "@/lib/utils/recordingUrl";

export default function RecordedSessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await bookingApi.getRecordedSessions(user.id);
        if (!cancelled) setSessions(rows);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load recordings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary">Recorded Sessions</h1>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No recorded sessions yet. Sessions you choose to record will show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const asLearner = session.learner_id === user.id;
            const otherName = asLearner
              ? session.profiles?.name || "Mentor"
              : session.learner_profile?.name || "Learner";
            const isPlaying = playingId === session.id;
            const src = normalizeRecordingUrl(session.recording_playback_url);

            return (
              <div
                key={session.id}
                className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4"
              >
                <button
                  type="button"
                  onClick={() => setPlayingId(isPlaying ? null : session.id)}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-chip">
                    <User size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      Session with {otherName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(session.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <PlayCircle size={22} className="text-accent-link" />
                </button>

                {isPlaying && src ? (
                  <video src={src} controls autoPlay className="w-full rounded-xl bg-meeting-canvas" />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
