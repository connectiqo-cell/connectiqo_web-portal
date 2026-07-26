"use client";

import { MeetingProvider } from "@videosdk.live/react-sdk";

import { CallRoom } from "@/components/call/CallRoom";

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
  recordingRequested,
  otherUserName,
}: {
  meetingId: string;
  token: string;
  name: string;
  bookingId: string;
  mentorId: string;
  learnerId: string;
  isHost: boolean;
  recordingRequested: boolean;
  otherUserName: string;
}) {
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
    >
      <CallRoom
        bookingId={bookingId}
        mentorId={mentorId}
        learnerId={learnerId}
        meetingId={meetingId}
        token={token}
        isHost={isHost}
        recordingRequested={recordingRequested}
        otherUserName={otherUserName}
      />
    </MeetingProvider>
  );
}
