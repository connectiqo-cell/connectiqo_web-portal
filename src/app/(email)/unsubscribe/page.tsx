import Link from "next/link";

import { isUnsubscribeToken } from "@/lib/emailUnsubscribe";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Opened from the "Unsubscribe" link in Connectiqo emails. Showing this page changes
 * nothing — only the button does (link scanners open email links automatically).
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = first(params.t);
  const status = first(params.status);
  const validToken = isUnsubscribeToken(token);

  let heading: string;
  let message: React.ReactNode;
  let showButton = false;

  if (status === "done") {
    heading = "You're unsubscribed";
    message = (
      <>
        You won&apos;t get welcome or reminder emails from Connectiqo any more. Emails about your
        bookings (like a new session booked) will still arrive, so you don&apos;t miss a session.
      </>
    );
  } else if (!validToken || status === "invalid") {
    heading = "This link isn't valid";
    message = (
      <>
        The unsubscribe link is incomplete or has expired. Use the link from your most recent
        Connectiqo email, or write to us and we&apos;ll do it for you.
      </>
    );
  } else if (status === "error") {
    heading = "Something went wrong";
    message = <>We couldn&apos;t update your email settings just now. Please try again in a minute.</>;
    showButton = true;
  } else {
    heading = "Unsubscribe from Connectiqo emails?";
    message = (
      <>
        You&apos;ll stop getting welcome and &ldquo;complete your profile&rdquo; reminder emails. Emails
        about your bookings will still arrive, so you don&apos;t miss a session.
      </>
    );
    showButton = true;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <img src="/connectiqo_logo.png" alt="Connectiqo" width={56} height={56} className="h-14 w-14" />
      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{message}</p>
      </div>

      {showButton ? (
        <form method="post" action={`/api/email/unsubscribe?t=${encodeURIComponent(token)}`}>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary px-6 py-2.5 text-sm font-semibold text-text-on-accent"
          >
            {status === "error" ? "Try again" : "Unsubscribe"}
          </button>
        </form>
      ) : null}

      <p className="text-xs text-text-muted">
        Questions?{" "}
        <a href="mailto:contact@connectiqo.com" className="text-accent-link underline">
          contact@connectiqo.com
        </a>
        {" · "}
        <Link href="/" className="text-accent-link underline">
          Go to Connectiqo
        </Link>
      </p>
    </main>
  );
}
