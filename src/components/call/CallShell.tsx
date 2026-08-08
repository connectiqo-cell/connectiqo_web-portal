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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/70">
        <Loader2 size={28} className="animate-spin" />
        <p>Requesting camera and microphone access…</p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <AlertTriangle size={32} className="text-red-400" />
        <div>
          <h1 className="text-lg font-bold text-white mb-2">Camera/mic access blocked</h1>
          <div className="text-sm text-white/70 space-y-3">
            <p>
              <strong className="text-white">Click the lock icon</strong> 🔒 in your browser&apos;s address bar (next to the URL)
            </p>
            <p>
              <strong className="text-white">Select &quot;Allow&quot;</strong> for both Camera and Microphone in the permission dialog
            </p>
            <p>
              <strong className="text-white">Reload the page</strong> to start your session
            </p>
            <p className="pt-2 text-xs opacity-75">
              Or go to browser settings → Privacy and security → Site settings → Camera/Microphone and allow this site
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "insecure-context") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle size={32} className="text-red-400" />
        <h1 className="text-lg font-bold text-white">Secure connection required</h1>
        <p className="text-sm text-white/70">
          Camera and microphone access needs a secure connection. Open this page over{" "}
          <strong className="text-white">https://</strong>, or via <strong className="text-white">http://localhost</strong> if you&apos;re on the
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
        micEnabled: false,
        webcamEnabled: false,
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
