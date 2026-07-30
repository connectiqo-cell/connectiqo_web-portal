import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FrozenAccountNotice } from "@/components/FrozenAccountNotice";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  
  subsets: ["latin"],
});

export const metadata: Metadata = {

  title: "Connectiqo — Live 1-on-1 Mentorship",
  description:
    "Book live 1-on-1 video mentorship sessions with expert mentors on Connectiqo.",
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("@connectiqo/theme_mode");
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var mode = stored === "light" || stored === "dark"
      ? stored
      : (prefersLight ? "light" : "dark");
    document.documentElement.dataset.theme = mode;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <template
          dangerouslySetInnerHTML={{
            __html: `<script>${NO_FLASH_THEME_SCRIPT}</script>`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-void text-text-primary">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppShell>{children}</AppShell>
              <FrozenAccountNotice />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics debug={false} />
      </body>
    </html>
  );
}
