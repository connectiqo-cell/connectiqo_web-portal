import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "Email preferences · Connectiqo",
  robots: { index: false, follow: false },
};

/**
 * Own root layout (see route-groups.md): pages here are opened from links in emails,
 * often by people who aren't signed in, so they need none of the app's providers
 * (auth bootstrap, notifications, app shell).
 */
export default function EmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-full bg-void text-text-primary antialiased">{children}</body>
    </html>
  );
}
