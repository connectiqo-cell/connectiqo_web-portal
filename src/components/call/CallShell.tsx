"use client";

import { MeetingProvider } from "@videosdk.live/react-sdk";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CallRoom } from "@/components/call/CallRoom";

type PermissionState = "checking" | "granted" | "denied" | "insecure-context";

/**
 * Requests camera/mic access up front, before VideoSDK ever touches
 * getUserMedia. Without this, a previously-blocked permission (no visible
 * prompt on repeat visits) surfaces deep inside the SDK's produce() call as
 * an opaque "track created but could not be published" error instead of a
 * clear, actionable message here.
 *
 * `navigator.mediaDevices` only exists in a secure context (https://, or
 * http://localhost) — on a plain-HTTP LAN address it's undefined, which
 * would otherwise crash here instead of explaining the real problem.
 */
function useMediaPermission() {
  // A static browser-capability check, not external state to synchronize —
  // computed once during render rather than via an effect + setState.
  const [hasMediaDevices] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia));
  const [state, setState] = useState<PermissionState>(
    hasMediaDevices ? "checking" : "insecure-context",
  );

  useEffect(() => {
    if (!hasMediaDevices) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        // Only probing for permission — MeetingProvider opens its own tracks.
        stream.getTracks().forEach((track) => track.stop());
        if (!cancelled) setState("granted");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [hasMediaDevices]);

  return state;
}

// Kept in its own module (dynamically imported with ssr:false from the call
// page) — @videosdk.live/react-sdk references browser-only globals at import
// time, which crashes ("self is not defined") if evaluated during SSR.
export function CallShell({
  meetingId,
  token,
  name,
  bookingId,
  mentorId,
  learnerId,
  isHost,
  otherUserName,
  slot,
}: {
  meetingId: string;
  token: string;
  name: string;
  bookingId: string;
  mentorId: string;
  learnerId: string;
  isHost: boolean;
  otherUserName: string;
  slot?: { date?: string | null; start_time?: string | null; end_time?: string | null } | null;
}) {
  const permission = useMediaPermission();

  if (permission === "checking") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-secondary">
        <Loader2 size={28} className="animate-spin" />
        <p>Requesting camera and microphone access…</p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle size={32} className="text-accent-error" />
        <h1 className="text-lg font-bold text-text-primary">Camera/mic access blocked</h1>
        <p className="text-sm text-text-secondary">
          Click the lock icon in your browser&apos;s address bar, allow Camera and Microphone for
          this site, then reload the page.
        </p>
      </div>
    );
  }

  if (permission === "insecure-context") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle size={32} className="text-accent-error" />
        <h1 className="text-lg font-bold text-text-primary">Secure connection required</h1>
        <p className="text-sm text-text-secondary">
          Camera and microphone access needs a secure connection. Open this page over{" "}
          <strong>https://</strong>, or via <strong>http://localhost</strong> if you&apos;re on the
          same computer as the server.
        </p>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId,
        name,
        micEnabled: true,
        webcamEnabled: true,
        debugMode: false,
      }}
      token={token}
      // Lets MeetingProvider call join() itself, inside the same effect where
      // it configures the SDK's token — calling join() from a child effect
      // (the old approach) raced MeetingProvider's own token-setup effect,
      // since React always runs a child's mount effects before its parent's,
      // so join() would fire before the SDK's token was actually set.
      joinWithoutUserInteraction
    >
      <CallRoom
        bookingId={bookingId}
        mentorId={mentorId}
        learnerId={learnerId}
        meetingId={meetingId}
        token={token}
        isHost={isHost}
        otherUserName={otherUserName}
        slot={slot}
      />
    </MeetingProvider>
  );
}
