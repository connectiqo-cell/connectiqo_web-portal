import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "Recording",
};

/**
 * Deliberately its own root layout (see route-groups.md) — this route is
 * never opened by a real user, only by VideoSDK's headless recording bot,
 * which has no Supabase session and needs none of the main app's chrome.
 * The bot has a tight, fixed connection window to join the room and start
 * receiving media; every extra provider (auth bootstrap, notifications
 * realtime, theme, app shell) here is bundle weight and JS execution time
 * competing with that window for no benefit, since nothing here is ever
 * seen by a human. Mirrors mobile's own recording-template app, which is a
 * bare Vite SPA with zero framework overhead for exactly this reason.
 */
export default function RecordingTemplateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  );
}
