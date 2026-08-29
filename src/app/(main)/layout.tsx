import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FrozenAccountNotice } from "@/components/FrozenAccountNotice";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  
  subsets: ["latin"],
});

const SITE_URL = "https://app.connectiqo.com";
const SITE_DESCRIPTION =
  "Book live 1-on-1 video mentorship sessions with expert mentors and creators on Connectiqo. Connect, learn, grow, and earn.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Connectiqo — Live 1-on-1 Mentorship",
    template: "%s | Connectiqo",
  },
  description: SITE_DESCRIPTION,
  keywords: ["mentorship", "1-on-1 video call", "live mentoring", "online coaching", "creator sessions"],
  openGraph: {
    type: "website",
    siteName: "Connectiqo",
    title: "Connectiqo — Live 1-on-1 Mentorship",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connectiqo — Live 1-on-1 Mentorship",
    description: SITE_DESCRIPTION,
  },
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("@connectiqo/theme_mode");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var mode = stored === "light" || stored === "dark"
      ? stored
      : (prefersDark ? "dark" : "light");
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
      </body>
    </html>
  );
}
