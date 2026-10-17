import type { Metadata } from "next";

import { NotFoundContent } from "@/components/NotFoundContent";

// global-not-found bypasses the app's normal rendering (no root layout, no
// providers), so it has to pull in its own global styles and render a full
// <html>/<body> document itself.
import "./globals.css";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-full bg-void text-text-primary antialiased">
        <NotFoundContent />
      </body>
    </html>
  );
}
