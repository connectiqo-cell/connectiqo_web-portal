import type { SVGProps } from "react";

export interface MentorSocialLinksData {
  youtube_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  linkedin_url?: string | null;
}

const SOCIAL_PLATFORMS = [
  {
    key: "youtube",
    label: "YouTube",
    color: "#FF0000",
    urlKey: "youtube_url" as const,
    Icon: YouTubeIcon,
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#E4405F",
    urlKey: "instagram_url" as const,
    Icon: InstagramIcon,
  },
  {
    key: "x",
    label: "X",
    color: "#1D9BF0",
    urlKey: "x_url" as const,
    Icon: XIcon,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    urlKey: "linkedin_url" as const,
    Icon: LinkedInIcon,
  },
];

/** Ensure a string is a usable https URL, or return empty. Mirrors the app's socialLinks.js. */
function normalizeSocialUrl(raw: string | null | undefined): string {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (!value) return "";
  value = value.replace(/[.,;]+$/, "");
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value.replace(/^\/+/, "")}`;
  }
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

/** Brand icon row — only platforms with a saved URL, matching the mobile app's mentor profile. */
export function MentorSocialLinks({
  mentor,
  className = "",
}: {
  mentor: MentorSocialLinksData | null | undefined;
  className?: string;
}) {
  if (!mentor) return null;
  const links = SOCIAL_PLATFORMS.map((p) => {
    const url = normalizeSocialUrl(mentor[p.urlKey]);
    return url ? { ...p, url } : null;
  }).filter((l): l is (typeof SOCIAL_PLATFORMS)[number] & { url: string } => l != null);

  if (!links.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="list">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          role="listitem"
          aria-label={`Open ${link.label}`}
          title={link.label}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface-panel shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: `${link.color}33` }}
        >
          <link.Icon width={16} height={16} style={{ color: link.color }} />
        </a>
      ))}
    </div>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.24 2.5h3.3l-7.2 8.23L23 21.5h-6.63l-5.2-6.8-5.94 6.8H1.92l7.7-8.8L1.5 2.5h6.8l4.7 6.22 5.24-6.22Zm-1.16 17h1.83L7.02 4.4H5.06l12.02 15.1Z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}
