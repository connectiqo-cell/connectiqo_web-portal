"use client";

import dynamic from "next/dynamic";

// @videosdk.live/react-sdk touches browser-only globals at import time, so
// it must never be evaluated during SSR — same reason CallShell is dynamic.
const RecordingTemplateView = dynamic(
  () => import("@/components/call/RecordingTemplateView").then((m) => m.RecordingTemplateView),
  { ssr: false },
);

export default function RecordingTemplatePage() {
  return <RecordingTemplateView />;
}
